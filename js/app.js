(function() {
	'use strict';

	// Firebase setup:
	var config = {
	    apiKey: "AIzaSyDRulUofq1zYX7Z1J2t--A2CRzObthoIDc",
	    authDomain: "fedenaimportconfig.firebaseapp.com",
	    databaseURL: "https://fedenaimportconfig.firebaseio.com",
	    // storageBucket: "fedenaimportconfig.appspot.com",
	    messagingSenderId: "197993359621"
	};
	firebase.initializeApp(config);

    // Angular setup:
	angular.module('RIPSImportPageApp', [])
	.controller('MainController', MainController);

	// controller for popup
	MainController.$inject = ['$q', '$scope'];
	function MainController($q, $scope) {
		var Ctrl = this;

		// Initial page data
		Ctrl.textareaWelcome = 'Student details here (delimited by commas \",\" or tabs)'
			+ ' - headers must match fields below EXACTLY\n'
			+ 'Required Fields:\n'
				+ '\tFull name, Date of Birth, UNHCR No\n'
			+ 'Optional Fields:\n'
				+ '\tNationality, Gender, Phone No, Category, Email\n'
				+ '\tParent Full name, Parent Relationship, Parent Phone';
		Ctrl.auto = true;
		Ctrl.scrollState = "L";

		// initialize arrays
		Ctrl.headerList = [];
		Ctrl.dataArray = [];
		Ctrl.widthArray = [];

		// Set up Firebase:
		FB_initFirebase(Ctrl, $scope, firebase);
		getStudentCount();

		// other initial variables:
		Ctrl.admissionDateFormatError = false;
		Ctrl.admissionDateFormatWarning = false;
		Ctrl.admissionDateFormatErrorLocation = "unknown";

		// =================================== IMPORT!!!! =============================
		Ctrl.importStudents = function() {
			/* 
				If fatal error is present, don't allow user to import students
				possible fatal errors:
					1) admissionDateFormatError
			*/
			if (!Ctrl.admissionDateFormatError) {
				countButtonClick('import_students');

				chrome.tabs.query({
					currentWindow: true,
					url: 'https://stars.fedena.com/*'
				}, function(tabs) {
					var activeTab = tabs[0];
					console.log('sending to tab:', activeTab);

					chrome.tabs.sendMessage(activeTab.id, {
						"message": "start_student_import",
						"data": Ctrl.dataArray,
						"auto": Ctrl.auto,
						"classData": {
							"class": Ctrl.class,
							"batch": Ctrl.batch
						},
						"otherData": {
							"admissionDate": Ctrl.formattedAdmissionDate
						}
					});
				});

			} else {
				console.log('FATAL ERROR! No importing allowed. Fix errors!');
			}
		}
		// ============================================================================

		// ================================ CLEAR DATA ================================
		Ctrl.clearChromeData = function() {
			countButtonClick('clear_data');

			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				var activeTab = tabs[0];

				chrome.tabs.sendMessage(activeTab.id, {
					"message": "clear_data",
					"value": true
				});
			});
		}
		// ============================================================================

		// ================================= FIREBASE =================================
		

		// Make sure user is signed in to google / give extension permission! :D
		Ctrl.Signin = function() {
			// $('button#signin').toggleClass('disabled-button');
			// $('button#signin').prop('disabled', true);

			var currentUser = firebase.auth().currentUser;

			if (currentUser) {
				// set Ctrl.username to username!
				console.log('signed in already, don\'t auth again');
				Ctrl.username = currentUser.displayName;
			} else {
				console.log('not signed in -> ask Google to authenticate');
				userAuth(true);
			}
		}

		// Sign user out of Google
		Ctrl.Signout = function() {
			firebase.auth().signOut().then(function() {
				// $('button#signin').toggleClass('disabled-button');
				// $('button#signin').prop('disabled', false);

				// Ctrl.username = '';
			}, function(error) {
			  	ThrowError({
			  		message: error,
			  		errMethods: ['mConsole', 'mAlert']
			  	});
			});
		}

		// get number of student records changed via firebase databasea:
		function getStudentCount() {

			$q.all( FB_getStudentCount(firebase) )
			.then(function(values) {
				var created = values[0].val();
				var fixed = values[1].val();

				// add them together & add it to Ctrl.studentCount!
				Ctrl.studentCount = created + fixed;
			});
		}

		/* Start the auth flow and authorizes for Firebase.
		 * @param{boolean} interactive True if the OAuth flow should request with an interactive mode.
		 */
		function userAuth(interactive) {
		  	// Request an OAuth token from the Chrome Identity API.
		  	chrome.identity.getAuthToken({interactive: !!interactive}, function(token) {

		    	if (chrome.runtime.lastError && !interactive) {
		    	  	console.log('It was not possible to get a token programmatically.');
			    } else if(chrome.runtime.lastError) {
			      	console.error(chrome.runtime.lastError);
			    } else if (token) {
		      		// Authrorize Firebase with the OAuth Access Token.
		      		var credential = firebase.auth.GoogleAuthProvider.credential(null, token);
		    	  	
		    	  	firebase.auth().signInWithCredential(credential).catch(function(error) {
			        	// The OAuth token might have been invalidated. Lets' remove it from cache.
			        	if (error.code === 'auth/invalid-credential') {
			          		chrome.identity.removeCachedAuthToken({token: token}, function() {
		            			startAuth(interactive);
		          			});
		        		} else {
		        			// valid credential! user is authenticated.
		        			//  make sure user data scruture is ready
		        			// console.log('inside Fb signInWithCredential [app.js], calling buildUserDataStruct');
		        			FB_buildUserDataStruct(firebase, firebase.auth().currentUser);
		        		}
		      		});
		    	} else {
		      		console.error('The OAuth Token was null');
		    	}
		  	});
		}

		// count number of button clicks, store in Firebase database:
		function countButtonClick(buttonCode) {
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				// var activeTab = tabs[0];

				var mObj = {
					action: 'firebase_increment_button_count',
					activeTabId: tabs[0].id,
					buttonCode: buttonCode
				}

				console.log('sending this obj: ', mObj);

				chrome.runtime.sendMessage(mObj);
			});
		}


		// ============================================================================

		// ============================= EVERYTHING ELSE ==============================
		Ctrl.formatAdmissionDate = function() {
			var date = Ctrl.admissionDate;
			// console.log('date: >' + date + '<');

			// catch date not being entered
			if (date === '' || date === undefined) {
				setAdmissionFormatWarning(true);
				return;
			}

			var dateArr = date.split('-');

			// catch date not being formatted w/ 2 "-"'s'
			if (dateArr.length !== 3) {
				setAdmissionFormatError(true, "DELIM");
				return;
			}

			var DD = parseInt( dateArr[0] );
			var MMM = dateArr[1].toUpperCase();
			var YYYY = parseInt( dateArr[2] );

			// catch date with numbers / strings in the wrong section!
			if ( isNaN(DD) ) {
				setAdmissionFormatError(true, "DAY");
				return;
			} else if ( isNaN(YYYY) ) {
				setAdmissionFormatError(true, "YEAR");
				return;
			} else if ( !isNaN(parseInt(MMM)) ) {
				setAdmissionFormatError(true, "MONTH");
				return;
			}

			// catch day out of range
			if (DD < 1 || DD > 31) {
				setAdmissionFormatError(true, "DAY");
				return;
			}

			// catch month in monthTranslator
			var monthTranslator = {
				"JAN": "01",	"FEB": "02",
				"MAR": '03',	"APR": '04',
				"MAY": '05',	"JUN": '06',
				"JUL": '07',	"AUG": '08',
				"SEP": '09',	"OCT": '10',
				"NOV": '11',	"DEC": '12'
			};
			if (monthTranslator[MMM] === undefined) {
				setAdmissionFormatError(true, "MONTH");
				return;
			}

			// catch year out of range
			if (YYYY < 1900 || YYYY > 2020) {
				setAdmissionFormatError(true, "YEAR");
				return;
			}

			// add leading zero to Day:
			if (DD < 10) DD = "0" + DD;

			// formattedAdmissionDate is sent to Extension, used nowhere else
			Ctrl.formattedAdmissionDate = YYYY + '-' +
				monthTranslator[MMM] + '-' + DD;

			setAdmissionFormatError(false);
			setAdmissionFormatWarning(false);
		}

		Ctrl.fillTable = function() {
			countButtonClick('create_table');

			var data = Ctrl.studentData;
			var delim, dataObj;

			delim = getDelim(data);

			console.log('class: ' + Ctrl.class);
			console.log('batch: ' + Ctrl.batch);

			if ( Ctrl.class === undefined || Ctrl.class === '' ||
				 Ctrl.batch === undefined || Ctrl.batch === '') {
				displayError('Class and Batch data are required!');
				return;
			} else {
				displayError('');
			}

			// if no delim found, quit.
			if ( delim === undefined ) return;

			if ( foundErrors(data) ) return;
			else {
				// convert data from text to array of objects (json-like)
				dataObj = convertData(data, delim);
			}

			if (dataObj.errors !== 0) return;
			else displayError(""); // remove error message

			// give angular the data from dataObj
			Ctrl.headerList = dataObj.headerList;
			// Ctrl.dataArray = dataObj.dataArray;

			Ctrl.dataArray = dataObj.dataArray

			// initialize width array for columns
			fillWidthArray(dataObj.headerList.length);
		};

		// Function scrolls between views (student import & fix)
		Ctrl.scroll = function(direction) {
			countButtonClick('arrows');

			toggleDisableArrowButtons();

			var importHTML = $('#full-import');
			var adjustHTML = $('#adjust-student-data');
			var tableHTML = $('#table-containers');

			if (direction === "L" && Ctrl.scrollState === "R") {
				importHTML.show(1000);
				tableHTML.show(500);
				adjustHTML.hide(1000);

				Ctrl.scrollState = "L";
			} else if (direction === "R" && Ctrl.scrollState === "L") {
				importHTML.hide(1000);
				tableHTML.hide(500);
				adjustHTML.show(1000);

				Ctrl.scrollState = "R";
			}
		};

		// function tells MainContent to start fixing student data
		Ctrl.fixStudentData = function() {
			if (Ctrl.category || Ctrl.formattedAdmissionDate) {
				countButtonClick('fix_students');

				chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
					var activeTab = tabs[0];

					var messageObj = {
						"message": "fix_student_data",
						"category": Ctrl.category,
						"admissionDate": Ctrl.formattedAdmissionDate
					};
					
					chrome.tabs.sendMessage(activeTab.id, messageObj);
				});
			} else {
				ThrowError({
					message: 'Nothing filled out -> no data to change!',
					errMethods: ['mConsole','mAlert']
				});
			}
		}

		// these functions deal with widths of columns in the table
		Ctrl.increaseWidth = function(index) { Ctrl.widthArray[index] += 20; }
		Ctrl.decreaseWidth = function(index) { Ctrl.widthArray[index] -= 20; }
		Ctrl.getWidth = function(index) { return Ctrl.widthArray[index]; }

		// ====================== INTERNAL FUNCTIONS =======================

		// toggle enabled & disabled arrow bottonss
		function toggleDisableArrowButtons() {
			var ArrowElems = [
				$('button#left-button'),
				$('button#right-button')				
			];

			for (var i = 0; i < ArrowElems.length; i++) {
				var arrowElem = ArrowElems[i];

				arrowElem.toggleClass('disabled-button');

				if ( arrowElem.hasClass('disabled-button') )
					// elem is now disabled, so diable it!
					arrowElem.prop('disabled', true);
				else
					// elem now isn't disabled, so enable it!
					arrowElem.prop('disabled', false);
			}
		}

		function fillWidthArray(size) {
			for (var i = 0; i < size; i++) {
				Ctrl.widthArray.push(100);
			}
		}

		// convert data from text to array of objects [like json]
		// if there's an error, send that error to the page & return 1
		function convertData(data, delim) {
			// first element in dataArray is # of errors
			var dataArray = [0];
			var returnObj = {
				errors: 0,
				headerList: [],
				dataArray: []
			}

			var rows = data.split("\n");

			// remove final row if it's only a \n  character (rows[index] will just be "")
			if (rows[rows.length - 1] === "") rows.pop();

			/*
				headerKeys will contain headers related to rows like this:
				{
					0: FirstName
					1: LastName
					2: DOB
					3: Nationality
					... etc
				}
			*/
			var headerKeys = {};

			// setup headerKeys:
			var headerRow = rows[0].split(delim);
			returnObj.headerList = headerRow;

			var numColumns = headerRow.length;

			for (var i = 0; i < headerRow.length; i++) {
				headerKeys[i] = headerRow[i].toUpperCase();
			}

			// setup the rest of the data (non-header)
			for (var rowIndex = 1; rowIndex < rows.length; rowIndex++) {
				var row = rows[rowIndex].split(delim);

				if (row.length !== numColumns) {
					// Error in # of delims between this row and header row.
					displayError("ROW " + (rowIndex + 1) + " HAS DIFFERENT # OF COLUMNS THAN HEADER");
					returnObj.errors = returnObj.errors + 1;
				}

				var studentObj = {};

				for (var cellIndex = 0; cellIndex < row.length; cellIndex++) {
					var cell = row[cellIndex];
					var propName = headerKeys[cellIndex];

					studentObj[propName] = cell;
				}

				returnObj.dataArray.push(studentObj);
			}

			return returnObj;
		}

		// look for basic errors (more than 1 line of data)
		function foundErrors(data) {
			// look for "\n" in data. if there aren't any, create an error
			if (data.indexOf("\n") === -1) {
				displayError("ONLY 1 LINE OF DATA - NEED TITLE ROW + DATA ROW!");
				return 1;
			}
		}

		/*
			Return delim from data.
			Priority:
				tab (\t)
				comma (,)
		*/
		function getDelim(data) {

			if (data === undefined) return;

			var tab1 = data.indexOf("\t");
			var com1 = data.indexOf(",");

			if (tab1 === -1 && com1 === -1) {
				displayError("STUDENT DATA MUST HAVE TABS OR COMMAS BETWEEN CELL DATA");
			} else {
				// displayError("");
			}

			if (tab1 !== -1) {
				Ctrl.delim = "tab";
				return "\t";
			} else if (com1 !== -1) {
				Ctrl.delim = "comma";
				return ",";
			}

			return "";
		}

		// display warning message in all uppercase
		function displayError(message) {
			Ctrl.errorMessage = message.toUpperCase();
		}

		function setAdmissionFormatError(status, location) {
			var errorLocation = location;
			if (errorLocation === '') {
				errorLocation = "unknown";
			}
			Ctrl.admissionDateFormatErrorLocation = errorLocation;
			
			Ctrl.admissionDateFormatWarning = false;
			Ctrl.admissionDateFormatError = status;
		}

		function setAdmissionFormatWarning(status) {
			Ctrl.admissionDateFormatError = false;
			// Ctrl.admissionDateFormatErrorLocation = "unknown";
			Ctrl.admissionDateFormatWarning = status;
		}

		
	};

})();