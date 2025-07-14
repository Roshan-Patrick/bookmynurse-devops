/*
Author       : Dreamguys
Template Name: Doccure - Bootstrap Template
Version      : 1.0
*/

(function($) {
    "use strict";
	
	// Stick Sidebar
	
	if ($(window).width() > 767) {
		if($('.theiaStickySidebar').length > 0) {
			$('.theiaStickySidebar').theiaStickySidebar({
			  // Settings
			  additionalMarginTop: 30
			});
		}
	}
	
// Sidebar
	if($(window).width() <= 991){
	var Sidemenu = function() {
		this.$menuItem = $('.main-nav a');
	};
	
	function init() {
		var $this = Sidemenu;
		$('.main-nav a').on('click', function(e) {
			if($(this).parent().hasClass('has-submenu')) {
				e.preventDefault();
			}
			if(!$(this).hasClass('submenu')) {
				$('ul', $(this).parents('ul:first')).slideUp(350);
				$('a', $(this).parents('ul:first')).removeClass('submenu');
				$(this).next('ul').slideDown(350);
				$(this).addClass('submenu');
			} else if($(this).hasClass('submenu')) {
				$(this).removeClass('submenu');
				$(this).next('ul').slideUp(350);
			}
		});
		//$('.main-nav li.has-submenu a.active').parents('li:last').children('a:first').addClass('active').trigger('click');
	}

	// Sidebar Initiate
	init();
	}
	
	// Textarea Text Count
	
	var maxLength = 100;
	$('#review_desc').on('keyup change', function () {
		var length = $(this).val().length;
		 length = maxLength-length;
		$('#chars').text(length);
	});
	
	// Select 2
	
	if($('.select').length > 0) {
		$('.select').select2({
			minimumResultsForSearch: -1,
			width: '100%'
		});
	}
	
	// Date Time Picker
	
	if($('.datetimepicker').length > 0) {
		$('.datetimepicker').datetimepicker({
			format: 'DD/MM/YYYY',
			icons: {
				up: "fas fa-chevron-up",
				down: "fas fa-chevron-down",
				next: 'fas fa-chevron-right',
				previous: 'fas fa-chevron-left'
			}
		});
	}
	
	// Fancybox Gallery
	
	if($('.clinic-gallery a').length > 0) {
		$('.clinic-gallery a').fancybox({
			buttons: [
				"thumbs",
				"close"
			],
		});	
	}
	
	// Floating Label

	if($('.floating').length > 0 ){
		$('.floating').on('focus blur', function (e) {
		$(this).parents('.form-focus').toggleClass('focused', (e.type === 'focus' || this.value.length > 0));
		}).trigger('blur');
	}
	
	// Mobile menu sidebar overlay
	
	// $('body').append('<div class="sidebar-overlay"></div>');
	// $(document).on('click', '#mobile_btn', function() {
	// 	$('main-wrapper').toggleClass('slide-nav');
	// 	$('.sidebar-overlay').toggleClass('opened');
	// 	$('html').addClass('menu-opened');
	// 	return false;
	// });
	
	// $(document).on('click', '.sidebar-overlay', function() {
	// 	$('html').removeClass('menu-opened');
	// 	$(this).removeClass('opened');
	// 	$('main-wrapper').removeClass('slide-nav');
	// });
	
	// $(document).on('click', '#menu_close', function() {
	// 	$('html').removeClass('menu-opened');
	// 	$('.sidebar-overlay').removeClass('opened');
	// 	$('main-wrapper').removeClass('slide-nav');
	// });
	
	// Mobile Menu
	
	/*if($(window).width() <= 991){
		mobileSidebar();
	} else {
		$('html').removeClass('menu-opened');
	}*/
	
	/*function mobileSidebar() {
		$('.main-nav a').on('click', function(e) {
			$('.dropdown-menu').each(function() {
			  if($(this).hasClass('show')) {
				  $(this).slideUp(350);
			  }
			});
			if(!$(this).next('.dropdown-menu').hasClass('show')) {
				$(this).next('.dropdown-menu').slideDown(350);
			}
			
		});
	}*/
	
	// Tooltip
 	if($('[data-toggle="tooltip"]').length > 0 ){
		$('[data-toggle="tooltip"]').tooltip();
	}
	
	// Add More Hours
	
    $(".hours-info").on('click','.trash', function () {
		$(this).closest('.hours-cont').remove();
		return false;
    });

    $(".add-hours").on('click', function () {
		
		var hourscontent = '<div class="row form-row hours-cont">' +
			'<div class="col-12 col-md-10">' +
				'<div class="row form-row">' +
					'<div class="col-12 col-md-6">' +
						'<div class="form-group">' +
							'<label>Start Time</label>' +
							'<select class="form-control">' +
								'<option>-</option>' +
								'<option>12.00 am</option>' +
								'<option>12.30 am</option>' + 
								'<option>1.00 am</option>' +
								'<option>1.30 am</option>' +
							'</select>' +
						'</div>' +
					'</div>' +
					'<div class="col-12 col-md-6">' +
						'<div class="form-group">' +
							'<label>End Time</label>' +
							'<select class="form-control">' +
								'<option>-</option>' +
								'<option>12.00 am</option>' +
								'<option>12.30 am</option>' +
								'<option>1.00 am</option>' +
								'<option>1.30 am</option>' +
							'</select>' +
						'</div>' +
					'</div>' +
				'</div>' +
			'</div>' +
			'<div class="col-12 col-md-2"><label class="d-md-block d-sm-none d-none">&nbsp;</label><a href="#" class="btn btn-danger trash"><i class="far fa-trash-alt"></i></a></div>' +
		'</div>';
		
        $(".hours-info").append(hourscontent);
        return false;
    });
	
	// Content div min height set
	
	function resizeInnerDiv() {
		var height = $(window).height();	
		var header_height = $(".header").height();
		var footer_height = $(".footer").height();
		var setheight = height - header_height;
		var trueheight = setheight - footer_height;
		$(".content").css("min-height", trueheight);
	}
	
	if($('.content').length > 0 ){
		resizeInnerDiv();
	}

	$(window).resize(function(){
		if($('.content').length > 0 ){
			resizeInnerDiv();
		}
		/*if($(window).width() <= 991){
			mobileSidebar();
		} else {
			$('html').removeClass('menu-opened');
		}*/
	});
	
	// Slick Slider
	
	if($('.specialities-slider').length > 0) {
		$('.specialities-slider').slick({
			dots: true,
			autoplay:false,
			infinite: true,
			variableWidth: true,
			prevArrow: false,
			nextArrow: false
		});
	}
	
	if($('.doctor-slider').length > 0) {
		$('.doctor-slider').slick({
			dots: false,
			autoplay:false,
			infinite: true,
			variableWidth: true,
		});
	}
	if($('.features-slider').length > 0) {
		$('.features-slider').slick({
			dots: true,
			infinite: true,
			centerMode: true,
			slidesToShow: 3,
			speed: 500,
			variableWidth: true,
			arrows: false,
			autoplay:false,
			responsive: [{
				  breakpoint: 992,
				  settings: {
					slidesToShow: 1
				  }

			}]
		});
	}
	
	// Date Time Picker
	
	if($('.datepicker').length > 0) {
		$('.datepicker').datetimepicker({
			viewMode: 'years',
			showTodayButton: true,
			format: 'DD-MM-YYYY',
			// minDate:new Date(),
			widgetPositioning:{
				horizontal: 'auto',	
				vertical: 'bottom'
			}
		});
	}
	
	// Chat

	var chatAppTarget = $('.chat-window');
	(function() {
		if ($(window).width() > 991)
			chatAppTarget.removeClass('chat-slide');
		
		$(document).on("click",".chat-window .chat-users-list a.media",function () {
			if ($(window).width() <= 991) {
				chatAppTarget.addClass('chat-slide');
			}
			return false;
		});
		$(document).on("click","#back_user_list",function () {
			if ($(window).width() <= 991) {
				chatAppTarget.removeClass('chat-slide');
			}	
			return false;
		});
	})();
	
	// Circle Progress Bar
	
	function animateElements() {
		$('.circle-bar1').each(function () {
			var elementPos = $(this).offset().top;
			var topOfWindow = $(window).scrollTop();
			var percent = $(this).find('.circle-graph1').attr('data-percent');
			var animate = $(this).data('animate');
			if (elementPos < topOfWindow + $(window).height() - 30 && !animate) {
				$(this).data('animate', true);
				$(this).find('.circle-graph1').circleProgress({
					value: percent / 100,
					size : 400,
					thickness: 30,
					fill: {
						color: '#da3f81'
					}
				});
			}
		});
		$('.circle-bar2').each(function () {
			var elementPos = $(this).offset().top;
			var topOfWindow = $(window).scrollTop();
			var percent = $(this).find('.circle-graph2').attr('data-percent');
			var animate = $(this).data('animate');
			if (elementPos < topOfWindow + $(window).height() - 30 && !animate) {
				$(this).data('animate', true);
				$(this).find('.circle-graph2').circleProgress({
					value: percent / 100,
					size : 400,
					thickness: 30,
					fill: {
						color: '#68dda9'
					}
				});
			}
		});
		$('.circle-bar3').each(function () {
			var elementPos = $(this).offset().top;
			var topOfWindow = $(window).scrollTop();
			var percent = $(this).find('.circle-graph3').attr('data-percent');
			var animate = $(this).data('animate');
			if (elementPos < topOfWindow + $(window).height() - 30 && !animate) {
				$(this).data('animate', true);
				$(this).find('.circle-graph3').circleProgress({
					value: percent / 100,
					size : 400,
					thickness: 30,
					fill: {
						color: '#1b5a90'
					}
				});
			}
		});
	}	
	
	if($('.circle-bar').length > 0) {
		animateElements();
	}
	$(window).scroll(animateElements);
	
})(jQuery);

const dayElements = document.querySelectorAll('.day-select');
const timeSlots = document.querySelectorAll('.timing');
const bookButton = document.getElementById('bookButton');

// Show time slots for the selected day
dayElements.forEach(day => {
	day.addEventListener('click', function() {
		const selectedDay = day.getAttribute('data-day');

		// Hide all time slots and show only the selected day's slots
		document.querySelectorAll('.time-slot').forEach(slot => slot.style.display = 'none');
		document.querySelector(`.time-slot[data-day="${selectedDay}"]`).style.display = 'block';

		// Deselect all days and select the clicked day
		dayElements.forEach(d => d.classList.remove('active'));
		day.classList.add('active');

		// Reset book button and time slot selection
		bookButton.classList.add('disabled');
		bookButton.textContent = 'Proceed to Pay';
		timeSlots.forEach(slot => slot.classList.remove('selected'));
	});
});

// Handle time slot selection
timeSlots.forEach(slot => {
	slot.addEventListener('click', function(e) {
		e.preventDefault();

		// Deselect other slots and select the clicked slot
		timeSlots.forEach(s => s.classList.remove('selected'));
		slot.classList.add('selected');

		// Enable booking button
		bookButton.classList.remove('disabled');
		bookButton.textContent = 'Book';
	});
});
/*-----api---
const bookingData = {
userId: 123,
date: '2024-11-11',
timeSlot: '10:00 AM',
status: 'confirmed' // Or whatever status you want to set
};

fetch('/api/bookings', {
method: 'POST',
headers: {
'Content-Type': 'application/json'
},
body: JSON.stringify(bookingData)
})
.then(response => response.json())
.then(data => {
// Handle success (e.g., show confirmation message)
console.log('Booking successful:', data);
})
.catch((error) => {
// Handle error
console.error('Error:', error);
});
-----------------------*/

// document.addEventListener("DOMContentLoaded", function () {
// 	const form = document.getElementById("bookingForm");
// 	const submitButton = document.getElementById("submitButton");
  
// 	submitButton.addEventListener("click", function (event) {
// 	  event.preventDefault(); // Prevent form from reloading the page
  
// 	  const formData = {
// 		name: document.getElementById("name").value.trim(),
// 		mobile: document.getElementById("mobile").value.trim(),
// 		nurseType: document.getElementById("nurseType").value,
// 		forWhom: document.getElementById("forWhom").value.trim(),
// 		location: document.getElementById("location").value,
// 		services: document.getElementById("services").value,
// 		preferences: document.getElementById("preferences").value,
// 	  };
  
// 	  // Validation
// 	  if (
// 		formData.name &&
// 		formData.mobile &&
// 		formData.nurseType &&
// 		formData.forWhom &&
// 		formData.location &&
// 		formData.services &&
// 		formData.preferences
// 	  ) {
// 		console.log("Form Submitted Successfully:", formData);
// 		alert("Form submitted successfully!");
// 		form.reset(); // Clear the form
// 	  } else {
// 		alert("Please fill out all fields before submitting!");
// 	  }
// 	});
//   });

  

//   // Function to toggle chat visibility
// function toggleChat() {
//     const chatbox = document.getElementById("chatbox");
//     chatbox.style.display = (chatbox.style.display === "none" || chatbox.style.display === "") ? "flex" : "none";
// }

// // Function to close chatbox
// function closeChat() {
//     document.getElementById("chatbox").style.display = "none";
// }

// // Function to send a message
// function sendMessage(event) {
//     if (event.key === "Enter" || event.type === "click") {
//         const userInput = document.getElementById("user-input").value;
//         if (userInput.trim()) {
//             // Display user message
//             displayMessage(userInput, "user");
//             document.getElementById("user-input").value = "";

//             // Display bot's response (for demonstration, simple static response)
//             setTimeout(() => {
//                 const botResponse = getBotResponse(userInput);
//                 displayMessage(botResponse, "bot");
//             }, 1000);
//         }
//     }
// }

// Function to display message in the chat
// function displayMessage(message, sender) {
//     const chatBody = document.getElementById("chat-body");
//     const messageDiv = document.createElement("div");
//     messageDiv.classList.add(sender === "user" ? "user-message" : "bot-message");
//     messageDiv.textContent = message;
//     chatBody.appendChild(messageDiv);
//     chatBody.scrollTop = chatBody.scrollHeight; // Scroll to the latest message
// }

// // Simple bot response function (You can replace this with more advanced logic)
// function getBotResponse(userInput) {
//     const lowerInput = userInput.toLowerCase();
//     if (lowerInput.includes("nurse")) {
//         return "Sure, I can help you find a nurse.";
//     } else if (lowerInput.includes("help")) {
//         return "How can I assist you today?";
//     } else {
//         return "I'm here to help! Please ask me something.";
//     }
// }

// document.getElementById('bookingForm').addEventListener('submit', function (e) {
// 	e.preventDefault();
// 	fetch(this.action, {
// 	  method: 'POST',
// 	  body: new FormData(this),
// 	})
// 	  .then((response) => {
// 		if (response.ok) {
// 		  alert('Form submitted successfully!');
// 		  this.reset();
// 		} else {
// 		  alert('There was a problem submitting the form.');
// 		}
// 	  })
// 	  .catch((error) => {
// 		alert('Error: ' + error.message);
// 	  });
//   });
  
  

function handleFormSubmit(event) {
	event.preventDefault(); // Prevent the default form submission
  
	var formData = new FormData(document.getElementById('bookingForm'));
  
	fetch('https://script.google.com/macros/s/AKfycbw2Hi-7jxveK_UG_aHtGu7YvGQK6bwx1-yylaLJ8GaywqG69giEoBBC3C75k2YAAgAx/exec', {
	  method: 'POST',
	  body: formData,
	})
	  .then(response => response.text())
	  .then(data => {
		// Display popup with centered content
		const popup = document.createElement("div");
		popup.id = "successPopup";
		popup.style.position = "fixed";
		popup.style.top = "50%";
		popup.style.left = "50%";
		popup.style.transform = "translate(-50%, -50%)";
		popup.style.padding = "20px";
		popup.style.background = "#fff";
		popup.style.border = "2px solid #048990";
		popup.style.borderRadius = "8px";
		popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
		popup.style.textAlign = "center";
		popup.style.zIndex = "1000";
  
		// Insert the image and message
		popup.innerHTML = `
		  <img src="src/assets/img/BMN - Nurse.png" alt="Nurse" style="width: 150px; height: auto; margin-bottom: 15px;">
		  <p style="color: #048990; font-size: 18px; font-weight: bold;">Dear Sir/Madam,</p>
		  <p style="color: #333; font-size: 16px;">Thanks for your enquiry. BookMyNurse team will get back to you at the earliest.</p>
		  <button id="closePopupButton" style="background-color: #f36302; color: #fff; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Proceed</button>
		`;
  
		// Append popup to the body
		document.body.appendChild(popup);
  
		// Close popup functionality with redirect
			const closePopupButton = document.getElementById("closePopupButton");
			closePopupButton.addEventListener("click", function () {
				window.location.href = "nurse.html"; // Redirect to nurse.html
			});

  
		// Reset the form
		document.getElementById('bookingForm').reset();
	  })
	  .catch(error => {
		console.error('Error:', error);
		alert('There was an error submitting the form.');
	  });
  }
  
  // Get the input field
  const mobileInput = document.getElementById('mobile');
  
  // Add an input event listener
  mobileInput.addEventListener('input', function () {
	// Remove any non-numeric characters
	this.value = this.value.replace(/[^0-9]/g, '');
	
	// Ensure the length doesn't exceed 10 digits
	if (this.value.length > 10) {
	  this.value = this.value.slice(0, 10);
	}
  });
  
	  
	  function showSuccessMessage(event) {
		event.preventDefault();  // Prevents the default form submission
	
		// You can use Fetch API or XMLHttpRequest to submit the form data via AJAX
		var form = document.getElementById("nurseRegistrationForm");
		
		var formData = new FormData(form);
	
		// Send form data to Google Apps Script (web app URL)
		fetch(form.action, {
		  method: 'POST',
		  body: formData
		})
		.then(response => response.text())
		.then(data => {
		  // Show success popup
		  alert("Form submitted successfully!");
	
		  // Optionally, clear the form after submission
		  form.reset();
		})
		.catch(error => {
		  console.error("Error:", error);
		  alert("There was an error submitting the form. Please try again.");
		});
	  }
	  

	  