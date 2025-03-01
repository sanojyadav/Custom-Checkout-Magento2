define([
    'ko',
    'uiComponent',
    'underscore',
    'Magento_Checkout/js/model/step-navigator',
    'mage/translate',
    'mage/calendar',
    'jquery',
    'mage/url'
], function (ko, Component, _, stepNavigator, $t, calendar, $, url) {
    'use strict';
    return Component.extend({
        defaults: {
            template: 'Vendor_CheckoutSteps/mystep'
        },
        nationalityOptions: ko.observableArray([]),
        loadNationalityOptions: function () {
            var self = this;
            $.ajax({
                url: window.location.origin + '/media/countries.json',
                type: 'GET',
                dataType: 'json',
                success: function (response) {
                    var countries = response.map(function (country) {
                        return {
                            value: country.id,
                            label: country.full_name_locale
                        };
                    });
                    self.nationalityOptions(countries);
                },
                error: function () {
                    alert($t('Failed to load nationality options.'));
                }
            });
        },

        flightDetails: {
            flightDateTime: ko.observable(''),
            flightNumber: ko.observable(''),
            nationality: ko.observable(''),
            isTransit: ko.observable(false) // Default value set to false
        },

        isVisible: ko.observable(true),
        minDateTime: ko.observable(''),
        visible: ko.observable(false),

        initialize: function () {
            this._super();
            this.initDateTimePicker = this.initDateTimePicker.bind(this);
            stepNavigator.registerStep('step_codes', null, 'Flight Information', this.isVisible, _.bind(this.navigate, this), 15);
            this.updateMinDateTime();
            return this;
        },

        navigate: function () {
            this.isVisible(true);
        },

        navigateToNextStep: function () {
            stepNavigator.next();
        },

        updateMinDateTime: function () {
            const now = new Date();
            const minDateTime = new Date(now.getTime() + (4 * 60 * 60 * 1000));
            const year = minDateTime.getFullYear();
            const month = String(minDateTime.getMonth() + 1).padStart(2, '0');
            const day = String(minDateTime.getDate()).padStart(2, '0');
            const hours = String(minDateTime.getHours()).padStart(2, '0');
            const minutes = String(minDateTime.getMinutes()).padStart(2, '0');
            this.minDateTime(`${year}-${month}-${day}T${hours}:${minutes}`);
        },

        validateDateTime: function (data, event) {
            const selectedDate = new Date(event.target.value);
            const currentDate = new Date();
            if (selectedDate.getTime() - currentDate.getTime() < 4 * 60 * 60 * 1000) {
                this.flightDetails.flightDateTime(this.minDateTime());
                alert($t('There should be at least a 4-hour gap.'));
            }
        },

        initDateTimePicker: function (element) {
            const now = new Date();
            const minDateTime = new Date(now.getTime() + (4 * 60 * 60 * 1000));
            const year = minDateTime.getFullYear();
            const month = String(minDateTime.getMonth() + 1).padStart(2, '0');
            const day = String(minDateTime.getDate()).padStart(2, '0');
            const hours = String(minDateTime.getHours()).padStart(2, '0');
            const minutes = String(minDateTime.getMinutes()).padStart(2, '0');
            $(element).val(`${year}-${month}-${day}T${hours}:${minutes}`);
        },

        validateStep: function () {
            var isValid = true;
            return isValid;
        },

        saveFlightDetails: function () {
            var flightData = this.getData();
            $.ajax({
                url: url.build('passport/checkout/savepassportdetails'),
                type: 'POST',
                dataType: 'json',
                data: flightData,
                success: function (response) {
                    if (response.success) {
                        console.log($t('Flight details saved successfully.'));
                    } else {
                        alert($t('Failed to save flight details.'));
                    }
                },
                error: function () {
                    alert($t('An error occurred while saving flight details.'));
                }
            });
            return false;
        },

        getData: function () {
            var flightData = {
                flightDateTime: this.flightDetails.flightDateTime(),
                nationality: this.flightDetails.nationality(),
                flightNumber: this.flightDetails.flightNumber(),
                isTransit: this.flightDetails.isTransit() // Ensure it is retrieved correctly
            };
            return flightData;
        },

        onChangeTransit: function (data, event) {
            if (event.target.value === 'Yes') {
                this.flightDetails.isTransit(true);
            } else {
                this.flightDetails.isTransit(false); // Ensure it defaults to false if not "Yes"
            }
        },

        isFarmComlete: function (data, event) {
            if (
                this.flightDetails.flightDateTime() !== '' &&
                this.flightDetails.nationality() !== '') {
                this.saveFlightDetails();
            }
        }
    });
});