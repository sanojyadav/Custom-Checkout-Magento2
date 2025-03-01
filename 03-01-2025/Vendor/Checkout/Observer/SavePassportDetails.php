<?php
namespace Vendor\Checkout\Observer;

use Magento\Framework\Event\ObserverInterface;
use Magento\Framework\Event\Observer;

class SavePassportDetails implements ObserverInterface
{
    protected $passportDetailsFactory;
    protected $logger;
    protected $checkoutSession;
    protected $storeManager;

    public function __construct(
        \Vendor\Checkout\Model\PassportDetailsFactory $passportDetailsFactory,
        \Psr\Log\LoggerInterface $logger,
        \Magento\Checkout\Model\Session $checkoutSession,
        \Magento\Store\Model\StoreManagerInterface $storeManager
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
            $order = $observer->getEvent()->getOrder();
            $customerId = $order->getCustomerId();
            
            // Get passport details from checkout session
            $passportData = $this->checkoutSession->getPassportDetails();
            $passportDataJson = json_encode($passportData);
            $noOfPasspot = 0;
            if (!empty($passportData)) {
                // Save primary passport holder
                if (isset($passportData['primary'])) {
                    $noOfPasspot += 1;
                    $this->savePassportRecord(
                        $passportData['primary'],
                        $order->getId(),
                        $customerId,
                        true
                    );
                }
                
                // Save additional passport holders
                if (isset($passportData['additional']) && is_array($passportData['additional'])) {
                    foreach ($passportData['additional'] as $additionalPassport) {
                        $noOfPasspot += 1;
                        $this->savePassportRecord(
                            $additionalPassport,
                            $order->getId(),
                            $customerId,
                            false
                        );
                    }
                }
                
                // Clear passport details from session
                $this->checkoutSession->unsPassportDetails();
            }

            // Save flight details from checkout session
            $flightData = $this->checkoutSession->getFlightDetails();
            if (!empty($flightData)) {
                $order->setData('flight_date_time', $flightData['flightDateTime']);
                $storeId = $this->storeManager->getStore()->getId();
                if ($storeId == 1) {
                    $order->setData('flight_source', $flightData['nationality']);
                } else {
                    $order->setData('flight_destination', $flightData['nationality']);
                }
                $order->setData('is_transit', $flightData['isTransit']);
                /*added by================================================================================ Sanoj*/
                $order->setData('flight_no', $flightData['flightNumber']);
                $order->setData('passports', $passportDataJson);
                $order->setData('no_of_passports', $noOfPasspot);
                /*======================================End======================================================*/
                $order->save();

                // Clear flight details from session
                $this->checkoutSession->unsFlightDetails();
            }   

        } catch (\Exception $e) {
            $this->logger->critical('Error saving passport details: ' . $e->getMessage());
        }
    }

    protected function savePassportRecord($data, $orderId, $customerId, $isPrimary)
    {
        $passportDetails = $this->passportDetailsFactory->create();
        $passportDetails->setData([
            'order_id' => $orderId,
            'customer_id' => $customerId,
            'full_name' => $data['fullName'],
            'passport_number' => $data['passportNumber'],
            'nationality' => $data['nationality'], // Hardcoded for now
            'date_of_birth' => $data['dateOfBirth'],
            'passport_expiry' => $data['passportExpiry'],
            'flight_datetime' => $data['flightDateTime'],
            'is_primary' => $isPrimary
        ])->save();
    }
}