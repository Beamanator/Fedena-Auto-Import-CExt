// ==================== FIELD TRANSLATOR FILE =======================


// Purpose of this function is to set an easy place to translate the fields from the
//  input .json file into the output format needed in Registration.js
// @return: object with specific key : value pairs to map generic field names to
//   spreadsheet - used in MainContent.js
function getFieldTranslator(deptCode) {
	return {
		"STUDENT_FULL_NAME": 		"FULL NAME",
		"GENDER": 					"GENDER",
		"STUDENT_PHONE_NUMBER":		"PHONE NO",
		"STUDENT_EMAIL": 			"EMAIL",
		"DOB": 						"DATE OF BIRTH",
		"NATIONALITY": 				"NATIONALITY",
		"STUDENT_CATEGORY": 		"CATEGORY",

		"GUARDIAN_FULL_NAME": 		"PARENT FULL NAME",
		"GUARDIAN_PHONE_NUMBER": 	"PARENT PHONE",
		"GUARDIAN_RELATIONSHIP": 	"PARENT RELATIONSHIP",

		"UNHCR_CASE_NO":			"UNHCR NO"
	};
}