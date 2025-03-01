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

    /**
     * mystep - is the name of the component's .html template,
     * Webkul_CheckoutCustomSteps  - is the name of your module directory.
     */
    return Component.extend({
        defaults: {
            template: 'Vendor_Checkout/mystep'

        },

        nationalityOptions: ko.observableArray([]),
        isPrimaryPassportComplete: ko.observable(false),
        areAdditionalPassportsComplete: ko.observable(true),

        loadNationalityOptions: function () {
            var self = this;
            $.ajax({
                url: window.location.origin + '/media/nationalities.json',
                type: 'GET',
                dataType: 'json',
                success: function (response) {
                    var countries = response.map(function (country) {
                        return {
                            value: country.nationality,
                            label: country.nationality
                        };
                    });
                    self.nationalityOptions(countries);
                },
                error: function () {
                    alert($t('Failed to load nationality options.'));
                }
            });
        },

        primaryPassport: {
            fullName: ko.observable(''),
            passportNumber: ko.observable(''),
            nationality: ko.observable(''),
            dateOfBirth: ko.observable(''),
            passportExpiry: ko.observable(''),
            flightDateTime: ko.observable('2025-01-01')
        },

        additionalPassports: ko.observableArray([]),

        // add here your logic to display step,
        isVisible: ko.observable(true),

        flightDatetime: ko.observable(''),
        minDOB: ko.observable(''),

        minDateTime: ko.observable(''),
        visible: ko.observable(false),

        /**
         * @returns {*}
         */
        initialize: function () {
            this._super();
            // Subscribe to primary passport fields
            this.setupPrimaryPassportSubscriptions();
            // Bind the context to methods that will be used in bindings
            this.removePassportHolder = this.removePassportHolder.bind(this);
            this.addPassportHolder = this.addPassportHolder.bind(this);
            this.initDateTimePicker = this.initDateTimePicker.bind(this);

            // register your step
            stepNavigator.registerStep(
                // step code will be used as step content id in the component template
                'step_code',
                // step alias
                null,
                // step title value
                'Passport Information',
                // observable property with logic when display step or hide step
                this.isVisible,

                _.bind(this.navigate, this),

                /**
                 * sort order value
                 * 'sort order value' < 10: step displays before shipping step;
                 * 10 < 'sort order value' < 20 : step displays between shipping and payment step
                 * 'sort order value' > 20 : step displays after payment step
                 */
                13
            );
            this.updateMinDateTime();
            this.loadNationalityOptions();
            return this;
        },

        setupPrimaryPassportSubscriptions: function () {
            var self = this;

            // Watch primary passport fields
            ko.computed(function () {
                var isComplete = !!(
                    self.primaryPassport.fullName() &&
                    self.primaryPassport.passportNumber() &&
                    self.primaryPassport.nationality() &&
                    self.primaryPassport.dateOfBirth() &&
                    self.primaryPassport.passportExpiry() &&
                    self.primaryPassport.flightDateTime()
                );

                self.isPrimaryPassportComplete(isComplete);

                // If all forms are complete, trigger save
                if (isComplete && self.areAdditionalPassportsComplete()) {
                    self.autoSavePassportDetails();
                }
            });

            // Watch additional passports
            ko.computed(function () {
                var additionalComplete = true;

                self.additionalPassports().forEach(function (passport) {
                    if (!(passport.fullName() &&
                        passport.passportNumber() &&
                        passport.nationality() &&
                        passport.dateOfBirth() &&
                        passport.passportExpiry() &&
                        passport.flightDateTime())) {
                        additionalComplete = false;
                    }
                });

                self.areAdditionalPassportsComplete(additionalComplete);

                // If all forms are complete, trigger save
                if (additionalComplete && self.isPrimaryPassportComplete()) {
                    self.autoSavePassportDetails();
                }
            });
        },

        /**
         * The navigate() method is responsible for navigation between checkout steps
         * during checkout. You can add custom logic, for example some conditions
         * for switching to your custom step
         * When the user navigates to the custom step via url anchor or back button we_must show step manually here
         */
        navigate: function () {
            this.isVisible(true);
        },

        /**
         * @returns void
         */
        navigateToNextStep: function () {
            stepNavigator.next();
        },

        updateMinDateTime: function () {
            const now = new Date();
            const minDateTime = new Date(now.getTime() + (4 * 60 * 60 * 1000));
            const minDOB = new Date();
            minDOB.setFullYear(minDOB.getFullYear() - 2);
            const minPassportExpiryTime = new Date(now.getDate());

            const year = minDateTime.getFullYear();
            const month = String(minDateTime.getMonth() + 1).padStart(2, '0');
            const day = String(minDateTime.getDate()).padStart(2, '0');
            const hours = String(minDateTime.getHours()).padStart(2, '0');
            const minutes = String(minDateTime.getMinutes()).padStart(2, '0');

            this.minDateTime(`${year}-${month}-${day}`);
            this.minDOB(minDOB.toISOString().split('T')[0]);
            this.primaryPassport.dateOfBirth(minDOB.toISOString().split('T')[0]);

            //this.flightDatetime(this.minDateTime());
        },

        validateDateOfBirth: function (data, event) {
            const selectedDate = new Date(event.target.value);
            const minDOB = new Date();
            minDOB.setFullYear(minDOB.getFullYear() - 2);

            if (selectedDate >= new Date()) {
                alert($t('Date of Birth must be at least 2 years before today.'));
                event.target.value = minDOB.toISOString().split('T')[0];
                this.primaryPassport.dateOfBirth(minDOB.toISOString().split('T')[0]);
            }
        },

        validatePassportNumber: function (data, event) {
            const passportNumber = event.target.value.trim();
            const passportRegex = /^[A-Za-z0-9]{10,15}$/; // General format: alphanumeric, 5-15 characters

            if (!passportRegex.test(passportNumber)) {
                alert($t('Invalid passport number. It must be 10-15 alphanumeric characters.'));
                event.target.value = '';
                this.primaryPassport.passportNumber('');
            }
        },

        validatePassportExpiry: function (data, event) {
            const selectedDate = new Date(event.target.value);
            const today = new Date();

            if (selectedDate <= today) {
                alert($t('Passport expiry date must be a future date.'));
                event.target.value = this.getTomorrowDate();
                this.primaryPassport.passportExpiry(this.getTomorrowDate());
            }
        },

        validateDateTime: function (data, event) {
            const selectedDate = new Date(event.target.value);
            const currentDate = new Date();

            if (selectedDate.getTime() - currentDate.getTime() < 4 * 60 * 60 * 1000) {
                this.primaryPassport.dateOfBirth(this.minDateTime());
                this.flightDatetime(this.minDateTime());
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

            // Validate primary passport holder
            if (!this.primaryPassport.fullName() ||
                !this.primaryPassport.passportNumber() ||
                !this.primaryPassport.dateOfBirth() ||
                !this.primaryPassport.passportExpiry()) {
                isValid = false;

            }

            // Validate additional passport holders
            this.additionalPassports().forEach(function (passport) {
                if (!passport.fullName() || !passport.passportNumber() || !passport.dateOfBirth() || !passport.passportExpiry()) {
                    isValid = false;
                }
            });


            return isValid;
        },





       



        addPassportHolder: function () {
            var newPassport = {
                fullName: ko.observable(''),
                passportNumber: ko.observable(''),
                nationality: ko.observable(''),
                dateOfBirth: ko.observable(''),
                passportExpiry: ko.observable(''),
                flightDateTime: ko.observable('2025-01-01'),
                nationalityOptions: self.nationalityOptions
            };

            // Add subscriptions to new passport fields
            this.setupAdditionalPassportSubscriptions(newPassport);

            this.additionalPassports.push(newPassport);
            this.visible(true);
            this.areAdditionalPassportsComplete(false); // Reset completion status
        },

        // Validation for required fields
        validateRequiredFields: function () {
            var isValid = true;
            var firstErrorField = null;

            // Check if the required fields are empty
            $('[data-validate*="required"]').each(function () {
                var field = $(this);
                var value = field.val();

                // If field is required and empty, show error and mark it invalid
                if (field.is(':visible') && !value) {
                    isValid = false;
                    field.addClass('error');
                    // If it's the first error, set it to scroll to
                    if (!firstErrorField) {
                        firstErrorField = field;
                    }
                } else {
                    field.removeClass('error');
                }
            });

            // Scroll to the first field with error if validation fails
            if (!isValid && firstErrorField) {
                $('html, body').animate({
                    scrollTop: firstErrorField.offset().top - 50  // Adjust with margin
                }, 500);
            }

            return isValid;
        },

        setupAdditionalPassportSubscriptions: function (passport) {
            var self = this;

            // Watch all fields of this passport
            ko.computed(function () {
                var isComplete = !!(
                    passport.fullName() &&
                    passport.passportNumber() &&
                    passport.nationality() &&
                    passport.dateOfBirth() &&
                    passport.passportExpiry() &&
                    passport.flightDateTime()
                );

                // Update overall additional passports completion status
                var allComplete = true;
                self.additionalPassports().forEach(function (p) {
                    if (!(p.fullName() &&
                        p.passportNumber() &&
                        p.nationality() &&
                        p.dateOfBirth() &&
                        p.passportExpiry() &&
                        p.flightDateTime())) {
                        allComplete = false;
                    }
                });

                self.areAdditionalPassportsComplete(allComplete);
            });
        },

        autoSavePassportDetails: function () {
            var self = this;
            // Debounce the save to prevent multiple rapid-fire saves
            clearTimeout(this.saveTimeout);
            this.saveTimeout = setTimeout(function () {
                var passportData = self.getData();

                $.ajax({
                    url: url.build('passport/checkout/savepassportdetails'),
                    type: 'POST',
                    dataType: 'json',
                    data: passportData,
                    success: function (response) {
                        if (response.success) {
                            // Optional: Show success message
                            // $('body').trigger('processStart'); // Show loader
                            console.log('Passport details saved automatically');
                        } else {
                            console.error('Failed to save passport details');
                        }
                    },
                    error: function () {
                        console.error('Error occurred while saving passport details');
                    }
                });
            }, 1000); // Wait 1 second after last change before saving
        },

        removePassportHolder: function (passport) {
            this.additionalPassports.remove(passport);
            if (this.additionalPassports.length == 0) {
                this.visible(false);
            }
        },

        savePassportDetails: function () {
            var passportData = this.getData();

            // Save passport details to session before proceeding
            $.ajax({
                url: url.build('passport/checkout/savepassportdetails'),
                type: 'POST',
                dataType: 'json',
                data: passportData,
                success: function (response) {
                    if (response.success) {
                        alert($t('Passport details saved successfully.'));
                    } else {
                        // Handle error
                        alert($t('Failed to save passport details.'));
                    }
                },
                error: function () {
                    alert($t('An error occurred while saving passport details.'));
                }
            });

            return false;
        },


        getData: function () {
            var passportData = {
                primary: {
                    fullName: this.primaryPassport.fullName(),
                    passportNumber: this.primaryPassport.passportNumber(),
                    nationality: this.primaryPassport.nationality(),
                    dateOfBirth: this.primaryPassport.dateOfBirth(),
                    passportExpiry: this.primaryPassport.passportExpiry(),
                    flightDateTime: '2025-01-01'
                },
                additional: []
            };

            this.additionalPassports().forEach(function (passport) {
                passportData.additional.push({
                    fullName: passport.fullName(),
                    passportNumber: passport.passportNumber(),
                    nationality: passport.nationality(),
                    dateOfBirth: passport.dateOfBirth(),
                    passportExpiry: passport.passportExpiry(),
                    flightDateTime: '2025-01-01'
                });
            });

            return passportData;
        },
    });
});


