<?php
namespace Vendor\Checkout\Model\ResourceModel;

use Magento\Framework\Model\ResourceModel\Db\AbstractDb;

class PassportDetails extends AbstractDb
{
    protected function _construct()
    {
        $this->_init('delhi_duty_free_passports', 'entity_id');
    }
}