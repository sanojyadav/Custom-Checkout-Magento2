<?php
namespace Vendor\Checkout\Model\ResourceModel\PassportDetails;

use Magento\Framework\Model\ResourceModel\Db\Collection\AbstractCollection;

class Collection extends AbstractCollection
{
    protected function _construct()
    {
        $this->_init(
            \Vendor\Checkout\Model\PassportDetails::class,
            \Vendor\Checkout\Model\ResourceModel\PassportDetails::class
        );
    }
}