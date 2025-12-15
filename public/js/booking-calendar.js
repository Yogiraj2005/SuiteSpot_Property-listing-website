// Initialize booking calendar with Flatpickr
document.addEventListener('DOMContentLoaded', function () {
    console.log('Booking calendar script loaded');

    const calendarInput = document.getElementById('bookingCalendar');
    console.log('Calendar input element:', calendarInput);

    if (!calendarInput) {
        console.error('Calendar input element not found!');
        return;
    }

    // Get booked dates from data attribute
    const bookedDatesData = calendarInput.dataset.bookedDates;
    console.log('Booked dates data:', bookedDatesData);

    let bookedRanges = [];

    if (bookedDatesData) {
        try {
            bookedRanges = JSON.parse(bookedDatesData);
            console.log('Parsed booked ranges:', bookedRanges);
        } catch (e) {
            console.error('Error parsing booked dates:', e);
        }
    }

    // Function to check if a date is booked
    function isDateBooked(date) {
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);

        for (let range of bookedRanges) {
            const start = new Date(range.start);
            const end = new Date(range.end);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);

            if (checkDate >= start && checkDate <= end) {
                return true;
            }
        }
        return false;
    }

    // Check if Flatpickr is available
    if (typeof flatpickr === 'undefined') {
        console.error('Flatpickr library not loaded!');
        return;
    }

    console.log('Initializing Flatpickr...');

    // Initialize Flatpickr
    try {
        const fp = flatpickr(calendarInput, {
            mode: 'range',
            minDate: 'today',
            dateFormat: 'Y-m-d',
            inline: true,
            showMonths: 2,
            disable: [
                function (date) {
                    return isDateBooked(date);
                }
            ],
            onChange: function (selectedDates, dateStr, instance) {
                console.log('Dates selected:', selectedDates);

                if (selectedDates.length === 2) {
                    // Update hidden form fields
                    const startDateInput = document.getElementById('startDate');
                    const endDateInput = document.getElementById('endDate');
                    const displayDiv = document.getElementById('selectedDatesDisplay');

                    if (startDateInput && endDateInput) {
                        startDateInput.value = instance.formatDate(selectedDates[0], 'Y-m-d');
                        endDateInput.value = instance.formatDate(selectedDates[1], 'Y-m-d');
                        console.log('Updated hidden fields:', startDateInput.value, endDateInput.value);
                    }

                    // Show selected dates
                    if (displayDiv) {
                        const startFormatted = instance.formatDate(selectedDates[0], 'M d, Y');
                        const endFormatted = instance.formatDate(selectedDates[1], 'M d, Y');
                        displayDiv.innerHTML = `<strong>Selected:</strong> ${startFormatted} to ${endFormatted}`;
                        displayDiv.style.display = 'block';
                        console.log('Display updated');
                    }
                } else {
                    const displayDiv = document.getElementById('selectedDatesDisplay');
                    if (displayDiv) {
                        displayDiv.innerHTML = '';
                        displayDiv.style.display = 'none';
                    }
                }
            },
            onDayCreate: function (dObj, dStr, fp, dayElem) {
                const date = dayElem.dateObj;

                // Add custom class for booked dates
                if (isDateBooked(date)) {
                    dayElem.classList.add('booked-date');
                    dayElem.title = 'This date is already booked';
                }
            },
            onReady: function () {
                console.log('Flatpickr calendar ready!');
            }
        });

        console.log('Flatpickr initialized successfully:', fp);
    } catch (error) {
        console.error('Error initializing Flatpickr:', error);
    }
});
