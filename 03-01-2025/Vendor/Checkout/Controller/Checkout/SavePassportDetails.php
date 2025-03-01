<?php

namespace Vendor\Checkout\Controller\Checkout;

use Magento\Framework\App\Action\HttpPostActionInterface;
use Magento\Framework\Controller\Result\JsonFactory;

class SavePassportDetails implements HttpPostActionInterface
{
    protected $jsonFactory;
    protected $checkoutSession;
    protected $request;

    public function __construct(
        JsonFactory $jsonFactory,
        \Magento\Checkout\Model\Session $checkoutSession,
        \Magento\Framework\App\RequestInterface $request
    ) {
        $this->jsonFactory = $jsonFactory;
        $this->checkoutSession = $checkoutSession;
        $this->request = $request;
    }

    public function execute()
    {
        $result = $this->jsonFactory->create();
        try {
            $passportData = $this->request->getPostValue();
            if ($passportData && !isset($passportData['isTransit'])) {
                $this->checkoutSession->setPassportDetails($passportData);
                return $result->setData(['success' => true]);
            } else if ($passportData && isset($passportData['isTransit'])) {
                $this->checkoutSession->setFlightDetails($passportData);
                return $result->setData(['success' => true]);
            }
        } catch (\Exception $e) {
            return $result->setData(['success' => false, 'message' => $e->getMessage()]);
        }
        return $result->setData(['success' => false]);
    }
}
