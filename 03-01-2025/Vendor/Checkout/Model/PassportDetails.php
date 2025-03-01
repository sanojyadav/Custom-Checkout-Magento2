<?php
namespace Vendor\Checkout\Model;

use Magento\Framework\Model\AbstractModel;

class PassportDetails extends AbstractModel
{
    protected function _construct()
    {
        $this->_init(\Vendor\Checkout\Model\ResourceModel\PassportDetails::class);
    }
}