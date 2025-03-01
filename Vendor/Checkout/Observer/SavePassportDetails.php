<?php

namespace Vendor\Checkout\Observer;

use Magento\Framework\Event\ObserverInterface;
use Magento\Framework\Event\Observer;
use Psr\Log\LoggerInterface;
use Magento\Checkout\Model\Session as CheckoutSession;
use Magento\Store\Model\StoreManagerInterface;
use Vendor\Checkout\Model\PassportDetailsFactory;
use Magento\Sales\Model\Order;

class SavePassportDetails implements ObserverInterface
{
    protected $passportDetailsFactory;
    protected $logger;
    protected $checkoutSession;
    protected $storeManager;

    public function __construct(
        PassportDetailsFactory $passportDetailsFactory,
        LoggerInterface $logger,
        CheckoutSession $checkoutSession,
        StoreManagerInterface $storeManager
    ) {
        $this->passportDetailsFactory = $passportDetailsFactory;
        $this->logger = $logger;
        $this->checkoutSession = $checkoutSession;
        $this->storeManager = $storeManager;
    }

    /**
     * Save passport details to database
     *
     * @param Observer $observer
     * @return void
     */
    public function execute(Observer $observer)
    {
        try {
            $this->logger->info('Observer SavePassportDetails triggered.');

            /** @var Order $order */
            $order = $observer->getEvent()->getOrder();
            if (!$order) {
                $this->logger->error('Order object not found in observer.');
                return;
            }

            $customerId = $order->getCustomerId();
            $orderId = $order->getId();

            // Retrieve passport details from session
            $passportData = $this->checkoutSession->getPassportDetails();
            $this->logger->info('Passport Data Retrieved: ' . json_encode($passportData));

            $passportDataJson = json_encode($passportData);
            $noOfPassports = 0;

            if (!empty($passportData)) {
                // Save primary passport holder
                if (isset($passportData['primary'])) {
                    $noOfPassports += 1;
                    $this->savePassportRecord(
                        $passportData['primary'],
                        $orderId,
                        $customerId,
                        true
                    );
                }

                // Save additional passport holders
                if (isset($passportData['additional']) && is_array($passportData['additional'])) {
                    foreach ($passportData['additional'] as $additionalPassport) {
                        $noOfPassports += 1;
                        $this->savePassportRecord(
                            $additionalPassport,
                            $orderId,
                            $customerId,
                            false
                        );
                    }
                }

                // Clear passport details from session
                $this->checkoutSession->unsPassportDetails();
            }

            // Retrieve flight details from session
            $flightData = $this->checkoutSession->getFlightDetails();
            $this->logger->info('Flight Data Retrieved: ' . json_encode($flightData));

            if (!empty($flightData)) {
                $order->setData('flight_date_time', $flightData['flightDateTime']);
                $storeId = $this->storeManager->getStore()->getId();

                if ($storeId == 1) {
                    $order->setData('flight_source', $flightData['nationality']);
                } else {
                    $order->setData('flight_destination', $flightData['nationality']);
                }

                $order->setData('is_transit', $flightData['isTransit']);
                $order->setData('flight_no', $flightData['flightNumber']);
                $order->setData('passports', $passportDataJson);
                $order->setData('no_of_passports', $noOfPassports);

                // Save the order with updated custom fields
                $order->save();
                $this->logger->info('Order Data Updated Successfully.');

                // Clear flight details from session
                $this->checkoutSession->unsFlightDetails();
            }
        } catch (\Exception $e) {
            $this->logger->critical('Error saving passport details: ' . $e->getMessage());
        }
    }

    /**
     * Save individual passport record to a separate table
     */
    protected function savePassportRecord($data, $orderId, $customerId, $isPrimary)
    {
        try {
            $passportDetails = $this->passportDetailsFactory->create();
            $passportDetails->setData([
                'order_id' => $orderId,
                'customer_id' => $customerId,
                'full_name' => $data['fullName'],
                'passport_number' => $data['passportNumber'],
                'nationality' => $data['nationality'],
                'date_of_birth' => $data['dateOfBirth'],
                'passport_expiry' => $data['passportExpiry'],
                'flight_datetime' => $data['flightDateTime'],
                'is_primary' => $isPrimary
            ])->save();

            $this->logger->info('Passport record saved for Order ID: ' . $orderId);
        } catch (\Exception $e) {
            $this->logger->critical('Error saving individual passport record: ' . $e->getMessage());
        }
    }
}
