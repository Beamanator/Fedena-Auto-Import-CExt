function fixStudentData(requestData) {
	// FIRST check to make sure Batch dropdown is populated
	//  get index of "option" selected in dropdown:
	var Bindex = document.getElementById('course_course_id').selectedIndex;

	if (Bindex === 0) {
		// batch hasn't been selected, so throw error and quit!
		ThrowError({
			message: 'Error! Select a batch first please :)',
			errMethods: ['mConsole','mAlert']
		});
		return;
	}
	// Batch has been selected, so move on to next criteria

	// SECOND check to make sure there are some students in the list
	var studentRowsOdd  = $('.students-table table tbody tr.tr-odd').toArray();
	var studentRowsEven = $('.students-table table tbody tr.tr-even').toArray();
	var studentRowArr = studentRowsOdd.concat(studentRowsEven);

	var studentArr = formatStudentArray(studentRowArr);

	var numStudents = studentRowsOdd.length + studentRowsEven.length;
	
	if (numStudents === 0) {
		// ERROR + Quit
		ThrowError({
			message: 'No students found in selected batch!',
			errMethods: ['mConsole','mAlert']
		});
		return;
	} else {
		// Some students exist -> check action state!
		var category = requestData.category;
		var admissionDate = requestData.admissionDate;

		var keys = [
			{'ACTION_STATE': 	'FIXING_STUDENT_DATA'},
			{'CATEGORY': 		category},
			{'ADMISSION_DATE': 	admissionDate},
			{'STUDENT_INDEX': 	0},
			{'STUDENT_DATA': 	studentArr}
		];

		// save keys in local storage
		updateStorageLocal(keys)
		.then(function(successMessage) {
			openStudentTab(0, studentArr);
		})
		.catch(function(err) {
			ThrowError({
				message: "Error in promise array",
				errMethods: ["mConsole", "mAlert"]
			});
		});
	}

	// If user manually clicks on a student, clear data!
	// setMousedownClear();
}

function openStudentTab(index, studentArray) {

	// var max = array.length;
	var studentURL = studentArray[index];

	console.log('opened St. no. ' + (index + 1));

	var mObj = {
		action: 'open_tab',
		studentURL: studentURL,
		index: index
	}

	chrome.runtime.sendMessage(mObj);
}

// gets student URL from Name & "View profile" buttons in stars.fedena.com/student/view_all
function getStudentURL(row) {
	var anchorElemArr = row.getElementsByTagName('a');

	if (anchorElemArr.length < 1) {
		return -1;
	} else {
		// usually there will be 2 [from Name & from 'View Profile'] so return 1 href
		return anchorElemArr[0].href;
	}
}

function fixNextStudent() {
	getValueFromStorage('STUDENT_DATA')
	.then(function(studentArray) {
		if (studentArray && studentArray.length > 0) {
			var keys = [
				{'STUDENT_INDEX': 	''}
			];

			return updateStorageLocal(keys)
		} else {
			return;
		}
	})
	.then(function(success) {
		return getMultipleValuesFromStorage([
			'STUDENT_INDEX',
			'STUDENT_DATA'
		]);
	})
	.then(function(keys) {
		var index = keys[0];
		var array = keys[1];

		if (!array) {
			// nothing stored here yet
			clearStudentData(false);
			return;
		} else if (index >= array.length) {
			// quit! out of range!
			clearStudentData();
			return;
		} else {
			openStudentTab(index, array);
		}
	})
	.catch(function(err) {
		ThrowError({
			message: err,
			errMethods: ["mConsole", "mAlert"]
		});
	});
}

// called from MainContent.js on student/edit/id page
function editStudent() {
	// console.log('editing student!');
	getMultipleValuesFromStorage(['CATEGORY', 'ADMISSION_DATE'])
	.then(function(keys) {
		var cat = keys[0];
		var date = keys[1];
 
		var FT = getFieldTranslator();

		// student category
		if (cat !== "") {
			insertValue( getDC( {"CATEGORY": cat}, FT, 'STUDENT_CATEGORY'), 'student_student_category_id' );
		}

		// admission date
		if (date !== "") {
			insertValue( date, 'student\\[admission_date\\].calendar_field' );	
		}

		// increment studentCount in firebase database:
		incrementStudentCount(1, 'FIXED');

		// submit form -> redirects back to student/profile/id
		$('input[name="commit"]').click();
	})
	.catch(function(error) {
		ThrowError({
			message: error,
			errMethods: ['mConsole', 'mAlert']
		});
	});
}

function atStudentProfile() {
	// if "Student record updated successfully" message is up, close tab.
	var update_msg = $('p.flash-msg')[0];

	if (update_msg !== undefined) {
		// this is where we'd close the tab probably.
		console.log('close tab!! send message to home tab!');

		var mObj = {
			action: 'close_tab'
		}

		chrome.runtime.sendMessage(mObj);
	} else {
		// else, click 'edit' button:
		// Student info page
		var urlList = window.location.href.split('/');
		var id = urlList[urlList.length - 1];

		// click 'Edit' at the bottom
		navigateToTab('/student/edit/' + id);
	}
}

// function setMousedownClear() {
// 	$('a').mousedown(function(event) {
// 		// event.preventDefault();
// 		clearStudentData();

// 		$('a').unbind('mousedown');
// 	});
// }

function formatStudentArray(elemArray) {
	var stArray = [];

	for (var i = 0; i < elemArray.length; i++) {
		var studentRowElem = elemArray[i];

		stArray.push( getStudentURL(studentRowElem) );
	}

	return stArray;
}