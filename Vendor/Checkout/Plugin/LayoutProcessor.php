<?php
namespace Vendor\Checkout\Plugin;
class LayoutProcessor
{
	public function afterProcess(\Magento\Checkout\Block\Checkout\LayoutProcessor $subject,
	        array  $jsLayout){
	    
	    
	    
	      
	         $jsLayout['components']['checkout']['children']['steps']['children']['shipping-step']['children']['shippingAddress']['children']['shipping-address-fieldset']['children']['street']['children'][0]['value'] = 'Delhi Duty Free';
	         $jsLayout['components']['checkout']['children']['steps']['children']['shipping-step']['children']['shippingAddress']['children']['shipping-address-fieldset']['children']['street']['children'][1]['value']= 'IGI Airport';

	        $jsLayout['components']['checkout']['children']['steps']['children']['shipping-step']['children']['shippingAddress']['children']['shipping-address-fieldset']['children']['country_id']['value'] = 'IN';
	        $jsLayout['components']['checkout']['children']['steps']['children']['shipping-step']['children']['shippingAddress']['children']['shipping-address-fieldset']['children']['region_id']['value'] = 573;
	        $jsLayout['components']['checkout']['children']['steps']['children']['shipping-step']['children']['shippingAddress']['children']['shipping-address-fieldset']['children']['city']['value'] = 'New Delhi';
	        $jsLayout['components']['checkout']['children']['steps']['children']['shipping-step']['children']['shippingAddress']['children']['shipping-address-fieldset']['children']['postcode']['value'] = '110037';
	      
	        return $jsLayout;
	    }
}
