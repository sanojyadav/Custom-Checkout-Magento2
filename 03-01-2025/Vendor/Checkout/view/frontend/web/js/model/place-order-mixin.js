define([
    'jquery',
    'mage/utils/wrapper',
    'Magento_Ui/js/model/messageList',
    'Magento_Checkout/js/model/full-screen-loader',
    'mage/translate'
], function ($, wrapper, messageList, fullScreenLoader, $t) {
    'use strict';

    return function (placeOrder) {
        return wrapper.wrap(placeOrder, function (originalAction, serviceUrl, payload, messageContainer) {
            var isValid = true;
            var missingFields = [];

            // Prevent default form submission
            if (typeof event !== 'undefined') {
                event.preventDefault();
                event.stopPropagation();
            }


            // Remove existing validation messages
            //$('.field._required input div.mage-error').remove();
            
            // Validate each required passport field
            $('#checkout-step-passport-information .field._required input, #checkout-step-title .field._required input').each(function() {
                var fieldElement = $(this);
                var fieldLabel = fieldElement
                                .closest('.field')
                                .find('label')
                                .text()
                                .trim()
                                .replace('*', '')
                                .trim();
                
                if (!fieldElement.val().trim()) {
                    isValid = false;
                    missingFields.push(fieldLabel);
                    
                    // Add error class to the field
                    fieldElement.addClass('mage-error');
                    
                    // Add error message after the field
                    if (!fieldElement.next('.mage-error').length) {
                        $('<div>').addClass('mage-error')
                                 .attr('generated', 'true')
                                 .html($t('This is a required field.'))
                                 .insertAfter(fieldElement);
                    }
                } else {
                    // Remove error class and message if field is valid
                    fieldElement.removeClass('mage-error');
                    fieldElement.next('.mage-error').remove();
                }
            });

            // Validate radio buttons
            $('#checkout-step-title .field._required input[type="radio"]').each(function() {
                var name = $(this).attr('name');
                var radioGroup = $('input[name="' + name + '"]');
                var radioGroupContainer = radioGroup.closest('.field');
                var fieldLabel = radioGroupContainer.find('label').first().text().trim().replace('*', '').trim();
                
                // Check if any radio in the group is checked
                if (radioGroup.filter(':checked').length === 0) {
                    isValid = false;
                    missingFields.push(fieldLabel);
                    
                    // Remove any existing error message first
                    radioGroupContainer.find('.mage-error').remove();
                    
                    // Add error message after the last radio button
                    $('<div>').addClass('mage-error')
                             .attr('generated', 'true')
                             .html($t('This is a required field.'))
                             .appendTo(radioGroupContainer);
                } else {
                    // Remove error message if a radio is selected
                    radioGroupContainer.find('.mage-error').remove();
                }
            });

            if (!isValid) {
                // Clear any existing messages
                messageList.clear();
                
                // Add summary error message using messageList
                messageList.addErrorMessage({
                    message: $t('Please fill in all required passport information: ') + missingFields.join(', ')
                });
                
                fullScreenLoader.stopLoader();
                
                // Return a rejected promise to prevent redirect
                return $.Deferred().reject();
            }
            return originalAction(serviceUrl, payload, messageContainer);
        });
    };
});