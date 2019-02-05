//=================================== CONSTANTS AREA =======================================
//function getClientFileName() {  return 'CEPListTestCurrent.json';   }
function getImportStatusContinue() { return 'CONTINUE_IMPORT' };
function getImportStatusNew() { return 'START_IMPORT_NOW' };
function getAutoImportDefault() { return true; }
function getClassID() { return 30704; }
function getBatchID() { return 76438; }

//================================ DOCUMENT FUNCTIONS ======================================
$(document).ready(function(){
	getValueFromStorage('ACTION_STATE')
	.then(function(action) {
		const url = window.location.href;

		switch(action) {
			case 'IMPORTING_NEW_STUDENTS':
				if (url === "https://stars.fedena.com/student/admission1") {
					
					StartClientImport( getImportStatusContinue() );
				} else if (url.indexOf("student/admission1_2/") !== -1) {
					var urlList = url.split('/');
					var id = urlList[urlList.length - 1];

					// redirect to parent detail page
					navigateToTab('/student/admission2/' + id);
				} else if (url.indexOf("student/admission2/") !== -1) {
					// Parent / Guardian Details page
					//	this page gets hit twice:
					//		1) when entering parent data
					//		2) after entering parent, just in case a 2nd parent is needed
					StartParentImport();
				} else if (url.indexOf("student/previous_data/") !== -1) {
					// Previous Education Details page
					var urlList = url.split('/');
					var id = urlList[urlList.length - 1];

					// redirect to Additional details page (UNHCR #)
					navigateToTab('/student/admission4/' + id);
				} else if (url.indexOf("student/admission3/") !== -1) {
					// Select Guardian as emergency contact page
					var urlList = url.split('/');
					var id = urlList[urlList.length - 1];

					// click "Finish" button
					// -> redirects to previous education details
					$('input[name="commit"]').click();
				} else if (url.indexOf("student/admission4/") !== -1) {
					// Additional details page -> add UNHCR No & save client info
					ImportStudentUNHCR();
				} else if (url.indexOf("student/profile/") !== -1) {
					// Student Profile page -> done importing, redirect to admission page
					navigateToTab('/student/admission1');
					// OLD: used to go to home, but as of Feb 2019, they have a different
					// -> home page with "dashlets"
					// navigateToTab('https://stars.fedena.com/user/dashboard');
				} else {
					// wrong page hit - stop client import!
					console.error(
						"ERROR: Not sure what to do at current tab! " +
						"Clearing student data so we don't do something unexpected."
					);
					clearStudentData();
				}
				break;
			case 'FIXING_STUDENT_DATA':
				if (url.indexOf('/student/profile/') !== -1) {
					// at "Student Profile page"
					// -> either click 'edit', or close tab
					atStudentProfile();
				} else if (url.indexOf('/student/edit/') !== -1) {
					// Edit student page
					editStudent();
				} else {
					// new page hit -> stop client import!
					clearStudentData();
				}
				break;
			default:
				message('current ACTION_STATE ('+ action +') is preventing script from running');
		}
	})
	.catch(function(err) {
		message(err);
	});	
});

/*
================================== CHROME LISTENERS ======================================
*/

// Listener tracks any changes to local storage in chrome console 
// From here: https://developer.chrome.com/extensions/storage
chrome.storage.onChanged.addListener(function(changes, namespace) {
	// console.log('storage changes', changes);
	for (key in changes) {
		var storageChange = changes[key];

		console.log('Storage key "%s" in namespace "%s" changed. ' +
			'Old value was "%s", new value is "%s".',
			key,
			namespace,
			storageChange.oldValue,
			storageChange.newValue
		);
	}
});

// Listener for messages from background.js & app.js
// "clicked_browser_action" is our point for kicking things off
chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
	if ( request.message === "start_student_import" ) {
		var keys = [
			{'STUDENT_INDEX': '0'},
			{'ACTION_STATE': 'IMPORTING_NEW_STUDENTS'},
			{'STUDENT_DATA': request.data},
			{'STUDENT_DATA_LENGTH': request.data.length},
			{'AUTO_IMPORT': request.auto},
			{'CLASS_DATA': request.classData},
			{'OTHER_DATA': request.otherData}
		];

		// save keys in local storage
		updateStorageLocal(keys)
		.then(function(successMessage) {
			// begin import loop!
			StartClientImport( getImportStatusNew() );
		});
	} else if ( request.message === "clear_data" ) {
		clearStudentData();
	} else if ( request.message === "fix_student_data" ) {
		fixStudentData(request);
	} else if ( request.message === "fix_next_student" ) {
		fixNextStudent();
	} else {
		console.log('listened to message, but no response->', request.message);
	}
});

function StartClientImport(status) {
	if (foundErrorDiv()) {
		// alert the user about the error. Developer will probably need to be involved :(
		alert('Import Student error - please contact developer');
	} else if (status === getImportStatusContinue() ) {
		getMultipleValuesFromStorage(['STUDENT_INDEX', 'STUDENT_DATA_LENGTH'])
		.then(function(keys) {
			var studentIndex = keys[0];
			var studentListLength = keys[1];

			if (studentIndex >= studentListLength) {
				clearStudentData();
				return getStudentByIndex(-1);
			} else {
				return getStudentByIndex(studentIndex);
			}
		})
		.then(function(student) {
			addStudent(student);
		})
		.catch(function(err) {
			console.log(err);
		});
	} else if (status === getImportStatusNew() ) {
		// starting from beginning	 so index is 0
		getStudentByIndex(0)
		.then(function(student) {
			addStudent(student);
		});
	}
}

function ImportStudentUNHCR() {
	// there won't be anny warning divs - you can click 'save' before entering UNHCR :(
	getValueFromStorage('STUDENT_INDEX')
	.then(function (studentIndex) {
		// TODO: fix this bandaid!
		//	bandaid = subtracting 1 from index here. index is being increased before the program
		// 	hits the next student, so i have to subtract one here. program should probably add
		//	1 to student index after adding UNHCR, once the student is truely done being imported.
		return getStudentByIndex(studentIndex - 1);
	})
	.then(function(student) {
		var FT = getFieldTranslator();
		var UNHCRNo = student[FT["UNHCR_CASE_NO"]];

		// TODO: this id is crazy, and seems like it could change easily.
		// 	Make a better way of hard-coding html element IDs!
		var err = insertValue(UNHCRNo, 'student_additional_details_7575_additional_info');

		// press "Save & proceed" button
		$('input[name="commit"]').click();
	})
	.catch(function(err) {
		console.log(err);
	});
}

function StartParentImport() {
	if ( foundErrorDiv() ) {
		// alert the user about the error. Developer will probably need to be involved :(
		console.log('error on the parent page! :(');
		alert('Import Parent error - please contact developer');
	} else if ( foundParentList() ) {
		// guardian successfully added, so click "Finish" which goes to next page.
		var urlList = window.location.href.split('/');

		// get id of student from url
		var id = urlList[urlList.length - 1];

		// redirect to previous education page (url = /student/previous_data/id)
		navigateToTab('/student/admission3/' + id);
	} else {
		getValueFromStorage('STUDENT_INDEX')
		.then(function(studentIndex) {
			// TODO: fix this bandaid!
			//	bandaid = subtracting 1 from index here. index is being increased before the program
			// 	hits the next student, so i have to subtract one here. program should probably add
			//	1 to student index after adding UNHCR, once the student is truely done being imported.
			return getStudentByIndex(studentIndex - 1);

			// return getStudentByIndex(studentIndex);
		})
		.then(function(studentObj) { 
			var FT = getFieldTranslator();

			// Counts the number of data items the parent has.
			var parentDataCount = 0;

			// get parent data from studentObj
			var parentFullName = studentObj[FT['GUARDIAN_FULL_NAME']];
			var parentPhoneNumber = studentObj[FT['GUARDIAN_PHONE_NUMBER']];
			var parentRelationship = studentObj[FT['GUARDIAN_RELATIONSHIP']];
			
			// if values aren't undefined / empty, add 1 to count
			if (parentFullName		!== undefined && parentFullName 	!== '') parentDataCount++;
			if (parentPhoneNumber	!== undefined && parentPhoneNumber 	!== '') parentDataCount++;
			if (parentRelationship 	!== undefined && parentRelationship !== '') parentDataCount++;
			
			// if studentObj contains all of the necessary parent data, add to page.
			if ( parentDataCount === 3 ) {
				addParent(studentObj, FT);
			} else if (parentDataCount === 0 ) {
				var urlList = window.location.href.split('/');
				var id = urlList[urlList.length - 1];

				// redirect to previous educational details page
				navigateToTab('/student/admission3/' + id);
			} else {
				// parentDataCount isn't 3 or 0, so it's an invalid amount 
				//	-> error and warn the user to contact dev.
				message('Only [' + parentDataCount + '] of [3] parent values populated. Stopping Import Here.', 3);
				clearStudentData();
			}
		})
		.catch(function(err) {
			console.log(err);
		});
	}
}

function addStudent(studentObj) {
	var errCount = 0;
	var FT;

	try {
		FT = getFieldTranslator(); // TODO: add this code to local store & make it part of popup?
	} catch {
		console.error(
			'Field Translator not found - probably not on correct page ' +
			'to start import??'
		);
	}

	// first, middle, and last name:
	errCount += splitStudentName( studentObj[FT['STUDENT_FULL_NAME']] );

	// Gender:
	errCount += insertGender( studentObj[FT['GENDER']] );

	// student phone number
	errCount += insertValue( studentObj[FT['STUDENT_PHONE_NUMBER']], 'student_phone1' );
	
	// student mobile number
	errCount += insertValue( studentObj[FT['STUDENT_MOBILE_NUMBER']], 'student_phone2' );

	// student category
	errCount += insertValue( getDC( studentObj, FT, 'STUDENT_CATEGORY'), 'student_student_category_id' );

	// student email address
	errCount += insertValue( studentObj[FT['STUDENT_EMAIL']], 		'student_email' );

	// Nationality:
	errCount += insertValue( getDC( studentObj, FT, 'NATIONALITY'),	'student_nationality_id' );

	// DOB - NOTE!!!! only need to change value, not the label!!!
	// If you're confused why the label is not changing DON'T WORRY, the
	// -> correct input field is being edited here, it will save the data correctly.
	errCount += insertValue( formatDOBfield( studentObj[FT['DOB']] ),
		'student\\[date_of_birth\\].calendar_field' );

	// Next: get & save Admission Date [from input element]
	getValueFromStorage('OTHER_DATA')
	.then(function(otherDataObj) {
		// assumption is that the admission date is in the correct format.
		//	logic for this is in app.js
		var admissionDate = otherDataObj.admissionDate;

		// if admissionDate isn't populated, don't change the field
		//	this means we'll just store the current date as admission date
		if (admissionDate !== undefined && admissionDate !== '') {
			insertValue( admissionDate,
				'student\\[admission_date\\].calendar_field' );	
		}
		

		// Next: get & save class / batch
		return getValueFromStorage('CLASS_DATA'); 
	})
	.then(function(classData) {
		var formattedClassID = formatClass(classData.class);
		// var formattedBatchID = formatBatch(classData.batch);

		if (formattedClassID === undefined) {
			// not entered correctly - skip everything!
			return;
		}

		var formattedClassData = {
			'classID': formattedClassID,
			'batch': classData.batch
		};

		return insertClass( formattedClassData, 'course_' );
	})
	.then(function(formattedClassData) {
		var formattedBatchID = formatBatch( formattedClassData.batch );

		if (formattedBatchID === undefined) {
			// not entered correctly - skip everything!
			return;
		}

		insertBatch( formattedBatchID, 'student_batch_id' );

		// update student index, then click save! (entering '' means increment index by 1)
		var key = [
			{'STUDENT_INDEX':''}
		];
		updateStorageLocal(key)
		.then(function(success) {
			// ========================================= click save! ==============================================
			getValueFromStorage('AUTO_IMPORT')
			.then(function(auto) {
				// add 1 to student count in firebase database :)
				incrementStudentCount(1, 'CREATED');

				// auto is from the popup's auto checkbox.
				if (auto) {
					// automatically click 'save' to automate import
					$('input.submit_button').click();
				} else {
					message('user must click \'save\' to continue semi-auto import!');
				}

				// -> after clicked, page redirects to stars....com/student/admission1_2/<id>
			});
		})
		.catch(function(err) {
			console.log(err);
		});
	})
	.catch(function(err) {
		// make sure program doesn't keep running
		var key = [
			{'ACTION_STATE': 'WAITING'}
		];

		// save keys in local storage
		updateStorageLocal(key)
		.then(function(successMessage) {
			// stop everything, wait for user to do something.
			alert('Check console for errors!');
			console.log('Errors: ' + err);
		});
	});
}

function addParent(studentObj, FT) {
	var errCount = 0;

	// var FT = getFieldTranslator();

	// first and last name:
	errCount += splitParentName( studentObj[FT["GUARDIAN_FULL_NAME"]] );

	// import parent data: name & phone number
	errCount += insertValue( studentObj[FT['GUARDIAN_PHONE_NUMBER']], 'guardian_office_phone1' );

	// insert parent's gender / relation!!! it's required!!
	// console.log('Relationship: ', studentObj[FT['GUARDIAN_RELATIONSHIP']] );
	insertParentRelationship( studentObj[FT['GUARDIAN_RELATIONSHIP']] )
	.then(function(message) {
		// click Finish button]
		// -> redirects to same page
		$('input[name="commit"]').click();
	})
	.catch(function(err) {
		console.log(err);
	});
}

// ======================================= OTHER FUNCTIONS ========================================

function clearStudentData(alertOverride) {
	var alertUser = true;

	if ( typeof(alertOverride) === "boolean" ) {
		// if it's not bool, it's probably undefined or invalid
		alertUser = alertOverride;
	}

	getValueFromStorage('STUDENT_INDEX')
	.then(function(index) {
		console.log('LAST INDEX TO IMPORT -> ' + index);

		var keys = [
			{'STUDENT_INDEX': '0'},
			{'STUDENT_DATA_LENGTH': '0'},
			{'ACTION_STATE': 'WAITING'},
			{'STUDENT_DATA': null},
			{'AUTO_IMPORT': getAutoImportDefault() },
			{'CLASS_DATA': {}},
			{'OTHER_DATA': {}},
			{'CATEGORY': ''},
			{'ADMISSION_DATE': 	''}
		];

		return updateStorageLocal(keys);
	})
	.then(function(successMessage) {
		var msg = 'background students data cleared';

		if (alertUser) {
			message(msg, 3);
		} else {
			message(msg);
		}
	})
	.catch(function(err) {
		console.log('error clearing data -> ',err);
	});
}

// errorExplanation div pops up if a required field isn't filled out, which shouldn't happen (hopefully)
function foundErrorDiv() {
	var errorDivs = $('#errorExplanation');

	if (errorDivs.length > 0) {
		var key = [
			{'ACTION_STATE': 'WAITING'}
		];

		// save keys in local storage
		updateStorageLocal(key)
		.then(function(successMessage) {

			console.log('Critical error in required field - read error on page and fix code!');
			alert('Import stopped - Critical error - please contact developer');

		});

		return true;
	} else {
		return false;
	}
}

function foundParentList() {
	// get number of parents already added by checking how many children the
	// 	parent div contains
	var numParents = $('div#parents').children();

	if (numParents.length > 0) {
		// if the student has parents, it means we just completed adding them. so move on.
		return true;
	} else {
		return false;
	}
}

function formatClass(classStr) {
	var ID = '';
	
	$('#course_ option').each(function(index, optionObj) {
		var option = $(this);
		if (option.val() === classStr) {
			// option.val() is the ID of the class
			ID = classStr;
			return false;
		} else if (option.text().trim().toUpperCase() === classStr.toUpperCase()) {
			// option.text() is the text name of the class -> return id (val)
			ID = option.val();
			return false;
		}
	});

	if (ID !== '') {
		return ID;
	} else {
		// should only get here if it didn't find any! :(
		console.log('class not found!');
		alert('Error - Class not found. Please make sure class is entered correctly');
	}
}

function formatBatch(batchStr) {
	var ID = '';

	$('#student_batch_id option').each(function(index, optionObj) {
		var option = $(this);
		if (option.val() === batchStr) {
			// option.val() is the ID of the class
			ID = batchStr;
			return false;	
		} else if (option.text().trim().toUpperCase() === batchStr.toUpperCase()) {
			// option.text() is the text name of the class -> return id (val)
			ID = option.val();
			return false;
		}
	});

	if (ID !== '') {
		return ID;
	} else {
		// should only get here if it didn't fine any! :(
		console.log('batch not found!');
		alert('Error - Batch not found. Please make sure batch is entered correctly');
	}
}

// navigates to specific tab of Fedena by clicking on the anchor with specified href / URL
function navigateToTab(tab_href) {
	$('a[href="' + tab_href + '"]')[0].click();
}

function insertClass(formattedClassData, classElemId) {
	return new Promise( function(resolve, reject) {

		var formattedClassID = formattedClassData.classID;

		$('#' + classElemId).val(formattedClassID);

		location.href="javascript:render_batch_list(" + formattedClassID + ")";

		// wait 0.5 seconds to check if loader has closed:
		setTimeout(function(formattedClassData) {

			getLoaderClosed()
			.then(function(message) {
				// after loader is closed, resolve this promise!
				resolve(formattedClassData);
			})
			.catch(function(err) {
				reject(err);
			});
		}, 500, formattedClassData);
	});
}

function getLoaderClosed() {
	return new Promise( function(resolve, reject) {

		// every 1 second, check if loader has closed
		var intervalID = setInterval(function() {

			// if loader has closed, stop timer and resolve 
			if ( !isLoaderVisible() ) {
				clearInterval(intervalID);
				resolve('loader closed');
			}

		}, 1000);
	});
}

function isLoaderVisible() {
	var loader = $('#loader');

	if (loader.css('display') === 'none') {
		return false;
	} else {
		return true;
	}
}

function insertBatch(formattedBatchID, batchElemId) {
	// var formattedBatchID = formattedClassData.batch;

	$('#' + batchElemId).val( formattedBatchID );
}

function insertGender(gender) {
	var err = 0;

	gender = gender.toUpperCase().trim();

	switch(gender) {
		// options for 'male' matching
		case 'M':
		case 'MALE':
			document.querySelector('#student_gender_m').click();
			break;

		// options for 'female' matching
		case 'F':
		case 'FEMALE':
			document.querySelector('#student_gender_f').click();
			break;

		// default = no matches = error
		default:
			console.error(`Error - gender <${gender}> not handled / invalid`);
			err++;
	}

	return err;
}

// @params: relationship - (string)
//				relationship between student and guardian
function insertParentRelationship(relationship) {
	var err = 0, wait = false;

	// TODO: what if this is empty for a student???? probs stop importing
	if (relationship === undefined) {
		alert('no guardian specified for student!');
		err += 1;
		return;
	}

	switch( relationship.toUpperCase() ) {
		case 'FATHER': case 'DAD':
			$('#relation-select').val('father');
			break;
		case 'MOTHER': case 'MOM':
			$('#relation-select').val('mother');
			break;
		default:
			// relation is something other than mom / dad (ex: sister, bro, etc)
			$('#relation-select').val('other');
			location.href="javascript:toggle_relation_box();";

			wait = true;
	}

	return new Promise( function(resolve, reject) {
		if (wait) {
			setTimeout( function(guardianRelationship) {
				$('#guardian_relation').val(guardianRelationship);
				resolve('done waiting - go time!');
			}, 500, relationship);
		} else {
			resolve('no need to wait!');
		}
	});
}

/*
	splits full name (from excel cell) with this logic:
	if (< 3 names)
		1st = first name
		2nd = last name (optional)
	if (>= 3 names)
		1st = first, middle name(s) = middle, last = last name
	@return: err -> number of errors
*/
function splitStudentName(fullName) {
	var err = 0;
	var nameList = fullName.trim().split(' ');
	var firstName = "", middleName = "", lastName = "";

	switch (nameList.length) {
		case 1:
			firstName = nameList[0];
			break;
		case 2:
			firstName = nameList[0];
			lastName = nameList[1];
			break;
		default:
			console.log('default name split - name length is 3 or longer');

			var nameLen = nameList.length;
			
			firstName = nameList[0];
			lastName = nameList[nameLen - 1];
			// lastName = nameList.last();

			// splice the middle names from the nameList array:
			var middleNameList = nameList.splice(1, nameLen -2);

			// join middle names with a space
			middleName = middleNameList.join(' ');
			break;
	}

	err += insertValue( firstName, 'student_first_name' );

	if ( middleName !== "" ) err += insertValue( middleName, 'student_middle_name' );
	if ( lastName !== "" ) err += insertValue( lastName, 'student_last_name' );

	return err;
}

/*
	splits parent name (from imported data) with this logic:
		1st = first name
		2nd - last = last names (optional)
	@return: err -> number of errors
*/
function splitParentName(fullName) {
	var err = 0;
	var nameList = fullName.trim().split(' ');
	var firstName = "", lastName = "";

	switch (nameList.length) {
		case 1:
			firstName = nameList[0];
			break;
		default:
			firstName = nameList[0];

			var lastNameList = nameList.slice(1); // get all entries after index 1

			lastName = lastNameList.join(' ');
			break;
	}

	err += insertValue( firstName, 'guardian_first_name' );
	if (lastName !== "") err += insertValue( lastName, 'guardian_last_name' );

	return err;
}

function getStudentByIndex(index) {
	return new Promise( function(resolve, reject) {
		if (index === -1) {
			reject('student index out of bounds. hopefully done importing');
		} else {
			getValueFromStorage('STUDENT_DATA')
			.then(function(studentList) {
				// resolve with specific student in list
				resolve(studentList[index]);
			});
		}
	});
}

// format dob into year-month-day (YYYY-MM-DD),
//  depending on if v1/v2/year has v1 > v2 or v2 > v1
function formatDOBfield(dob) {
	// remove '.' from beginning of dob string:
	if (dob.indexOf('.') === 0) {
		dob = dob.split('.').splice(1, 1)[0];
	}

	var dobArr = dob.split("/");

	// error if too many '/' characters found
	if ( dobArr.length > 3 ) {
		console.log('invalid DOB format - too many "/" characters: ' + dob);
		return 'undefined - error (too many "/" chars in DOB)';
	}

	// 3 '/' chars -> treat '/' as delim
	else if (dobArr.length == 3) {
		var v1 = addLeadingZero( dobArr[0] );
		var v2 = addLeadingZero( dobArr[1] );
		var year = dobArr[2];

		if (v2 <= 12) {
			// v2 should be the month, so orig format is day-month-year
			return `${year}-${v2}-${v1}`;
		} else {
			// v2 should be the day, so orig format is month-day-year
			return `${year}-${v1}-${v2}`;
		}
	}

	// less than 3 '/' characters -> try using '-' as delim
	else {
		dobArr = dob.split('-');

		// error if too many or too little '-' chars found
		if (dobArr.length > 3 || dobArr.length < 3) {
			console.log('invalid DOB format - cant match "DD/MM/YYYY" or ' +
				'"DD-MMM-YYYY"');
			return 'undefined - error (doesnt match "DD/MM/YYYY" or "DD-MMM-YYYY")';
		}

		let d = addLeadingZero( dobArr[0] );
		let m = addLeadingZero( getMonthNumberFromName(dobArr[1]) );
		let y = dobArr[2];

		if (m == -1) {
			console.log('month number error! - from ' + dobArr[1]);
			return 'undefined - error in month number ' + dobArr[1];
		}

		return `${y}-${m}-${d}`;
	}	
}

/**
 * Function gets a month's # in the year (ex: january = 1, may = 5, dec = 12)
 * and returns this number.
 * 
 * @param {string} monthCode - month (3-letter code or full name)
 * @returns {number} - month's number, or -1 if not found
 */
function getMonthNumberFromName( monthCode ) {
	let monthNumber = {
		'jan': 1,	'january': 1,
		'feb': 2,	'february': 2,
		'mar': 3,	'march': 3,
		'apr': 4,	'april': 4,
		'may': 5,
		'jun': 6,	'june': 6,
		'jul': 7,	'july': 7,
		'aug': 8,	'august': 8,
		'sep': 9,	'sept': 9,		'september': 9,
		'oct': 10,	'october': 10,
		'nov': 11,	'november': 11,
		'dec': 12,	'december': 12
	}[monthCode.toLowerCase()];

	// if undefined, no map found :(
	if (monthNumber == undefined) {
		console.log(`Couldn't match month code! (${monthCode})`);
		monthNumber = -1;
	}

	return monthNumber;
}

// if # is less than 10 (1, 3, 9, etc) and the string 'num' is only 1 character, add a leading zero.
function addLeadingZero(num) {
	if (parseInt(num) < 10 && num.length === 1) return ("0" + num);
	else return num;
}

// inserts value into textbox / date field / dropdown. Returns 1 if there was an error
function insertValue(value, id) {
	// if value exists, throw into field:
	if (value !== undefined) {
		$('#' + id).val(value);
		return 0;
	} else {
		console.log('error -> { possible Field Translator error: ' + id + '}');
		return 1;
	}
}

// increments student count type (created / fixed) in firebase
function incrementStudentCount(num, studentType) {
	var increment = num;
	var action = '';

	if (!num) increment = 1;

	switch (studentType) {
		case 'CREATED':
			action = 'firebase_increment_student_created_count';
			break;
		case 'FIXED':
			action = 'firebase_increment_student_fixed_count';
			break;
		default:
			console.log('not sure which studentType to go with!');
			return;
	}

	var mObj = {
		action: action,
		incrementSize: num
	};

	chrome.runtime.sendMessage(mObj);
}

// function to localize where messages are sent
// Options:
// 		1 = console.log (default)
//  	2 = alert()
// 		3 = both (console.log then alert)
function message(text, option) {
	if (!text) return;
	else {
		if (option === 1) {
			console.log(text);
		} else if (option === 2) {
			alert(text);
		} else if (option === 3) {
			console.log(text);
			alert(text);
		} else {
			// default message method - no valid 'option' specified
			console.log(text);
		}
	}
}

// save data to local storage
// @Returns a promise after value(s) have been saved
// format of valueList:
// 	[
// 		{'key1': 'value1'},
// 		{'key2': 'value2'}
// 	]
function updateStorageLocal(valueList) {
	var storePromises = [];
	// Check that valueList contains some values.
	if (!valueList || valueList.length < 1) {
		message('Error: No value specified to update');
		// TODO: add null promise here?
		return;
	}

	// loop through array valueList:
	for (var i = 0; i < valueList.length; i++) {
		var valueObj = valueList[i];

		// tempCount counts # of key / value pairs inside valueObj. If there's more than one, error and quit.
		var tempCount = 0;

		// vars to store key : value pair from valueObj.
		var key, value;

		// get key & value in 'valueObj':
		for (var k in valueObj) {
			tempCount++;
			if (tempCount > 1) {
				message('Error: Invalid format of valueList - Cannot store to local storage', 3);
				return;
			}

			key = k; value = valueObj[k];
		}

		/* ============== EXPLANATION FOR KEYS =============
				STUDENT_INDEX - holds the index of the current student to add to Fedena database.
								the index relates to the local storage of students.
								IFF value is not defined (or ''), adds one to student index!
				ACTION_STATE  -	holds the current state of the import.\
								IMPORTING				= the import process has begun
								ERROR_STATE				= error somewhere along the way. check logs.
		*/
		switch (key) {
			case 'STUDENT_INDEX':
				// console.log('updating student index with:', value, '<-');
				if (value != undefined && value !== '') {
					storePromises.push( saveValueToStorage('STUDENT_INDEX', value) );
				} else {
					// in this case, value (student-index) is undefined, so set to 0
					storePromises.push(
						getValueFromStorage('STUDENT_INDEX')
						.then(function(index) {
							if (index === undefined || index === '') index = 0;
							else if (typeof index != 'number') index = parseInt(index);
							return saveValueToStorage('STUDENT_INDEX', index + 1);
						})
					);
				}
				break;
			case 'STUDENT_DATA':
				var studentArray = value;
				storePromises.push(
					saveValueToStorage('STUDENT_DATA', studentArray)
				);
				break;
			case 'STUDENT_DATA_LENGTH':
				var studentArrayLength = value;
				storePromises.push(
					saveValueToStorage('STUDENT_DATA_LENGTH', studentArrayLength)
				);
				break;
			case 'AUTO_IMPORT':
				var autoImport = value;
				storePromises.push(
					saveValueToStorage('AUTO_IMPORT', autoImport)
				);
				break;
			case 'CLASS_DATA':
				var classData = value;
				storePromises.push(
					saveValueToStorage('CLASS_DATA', classData)
				);
				break;
			case 'OTHER_DATA':
				var otherData = value;
				storePromises.push(
					saveValueToStorage('OTHER_DATA', otherData)
				);
				break;
			case 'CATEGORY':
				var studentCategory = value;
				storePromises.push(
					saveValueToStorage('CATEGORY', studentCategory)
				);
				break;
			case 'ADMISSION_DATE':
				var admissionDate = value;
				storePromises.push(
					saveValueToStorage('ADMISSION_DATE', admissionDate)
				);
				break;
			case 'ACTION_STATE':
				// console.log('updating action state with: ', value);
				storePromises.push(
					saveValueToStorage('ACTION_STATE', value)
				);
				break;
		}
	}

	return Promise.all(storePromises);
}

// Function returns a promise w/ a message stating the key / value pair were stored successfully
// TODO: maybe do some type of validation on input / output.
function saveValueToStorage(key, value) {
	// if (key === "STUDENT_DATA") debugger;
	return new Promise( function(resolve, reject) {
		var obj = {};
		obj[key] = value;

		chrome.storage.local.set(obj, function() {
			// successful
			resolve('Saved: ' + key + ':' + value);
		});
	});
}

// Function returns a promise w/ the value from chrome data storage key:value pair
// TODO: maybe do some type of validation on input / output.
// TODO: change out from 'value' to {key: 'value'} - REQUIRES LOTS OF REFACTORING
function getValueFromStorage(key) {
	return new Promise( function(resolve, reject) {
		chrome.storage.local.get(key, function(item) {
			// successful
			resolve(item[key]);
		});
	});
}

// Function returns a promise (promise.all) with the returned values from given keys
function getMultipleValuesFromStorage(keys) {
	var promises = [];

	for (var i in keys) {
		promises.push( getValueFromStorage(keys[i]) );
	}

	return Promise.all(promises);
}
