/*
	Purpose: Convert text values from spreadsheets to appropriate codes in
		dropdowns of Registration pages
*/

// TODO: find all values in 'input' object / list / spreadsheet that aren't in specific
//  dropdowns
//  ex: 'M' -> 'Male' in GENDER
function findMissing(input) {

}

// Function loops through dropdown options of given 'id'
//  prints <option> elements that holds all items in the dropdown. value = each option id
//  text is formatted to go in getDC function
// ================================PURPOSE ==============================
//    to look for values (id's) in dropdowns, copy / paste output from Chrome Console to getDC() below!
function PrintDropdownToConsole(id) {
	var obj = {};
	$(`#${id} option`).each(function() {
		// obj[ $(this).val() ] = $(this).text().trim();
		obj[ $(this).text().trim() ] = $(this).val();
	});
	
	var dcText = '\nobj = {\n';

	$.each( obj, function( key, value ) {
		dcText += `\t'${key}': ${value},\n`;
		// dcText += '\t].indexOf(val) !== -1) { return ' + value + '; }\n'
	});

	dcText += '}';

	return dcText;
}

// ========================================================================================
//										Main Functions
// ========================================================================================

// Function checks if value exists in below lists. If not, returns default value (def)
function checkExist(val, origVal, dropdownName) {
	if (val === undefined) {
		console.log(`ERROR IN ${dropdownName} DROPDOWN --> <${origVal}> does not exist`);
	}

	return val;
}

// get Dropdown Code [manually] from list of values in specific dropdown 
// st = student object
// FT = Field Translator object
// field = field in student object
function getDC(st, FT, field) {
	// get value from student:
	var val = st[FT[field]];
	var obj;

	if (val) val = val.trim();

	switch(field) {
		case 'STUDENT_CATEGORY':
			obj = {
				'PDC': 7974,
				'Montessori Preschool': 7975,
				'CEP': 8036,
				'AEP': 8046,
				'babiker student': 8052
			};
			return checkExist( obj[val], val, 'Student Category');
			break;
		case 'course_':
			obj = {
				'Academic Discussion': 30439,
				'Alex\'s test Class': 30704,
				'Business Writing': 30419,
				'Community Psychology': 30411,
				'Economic Development': 30420,
				'Elementary  English': 30559,
				'Grade 2': 30694,
				'Grade1': 30560,
				'Montessori KG0': 30414,
				'Montessori KG1': 30415,
				'Montessori KG2': 30416,
				'Public Speaking': 30412,
			};
			return checkExist( obj[val], val, 'Class');
			break;
		case 'NATIONALITY':
			obj = {
				'Åland Islands': 485,
				'Afghanistan': 1,
				'Albania': 2,
				'Algeria': 3,
				'American Samoa': 525,
				'Andorra': 4,
				'Angola': 5,
				'Anguilla': 532,
				'Antarctica': 497,
				'Antigua and Barbuda': 6,
				'Argentina': 7,
				'Armenia': 8,
				'Aruba': 504,
				'Ascension Island': 495,
				'Australia': 9,
				'Austria': 10,
				'Azerbaijan': 11,
				'Bahamas': 12,
				'Bahrain': 13,
				'Bangladesh': 14,
				'Barbados': 15,
				'Belarus': 16,
				'Belgium': 17,
				'Belize': 18,
				'Benin': 19,
				'Bermuda': 503,
				'Bhutan': 20,
				'Bolivia': 21,
				'Bosnia and Herzegovina': 22,
				'Botswana': 23,
				'Bouvet Island': 513,
				'Brazil': 24,
				'British Indian Ocean Territory': 535,
				'British Virgin Islands': 501,
				'Brunei': 25,
				'Bulgaria': 26,
				'Burkina Faso': 27,
				'Burundi': 28,
				'Côte d’Ivoire': 469,
				'Cambodia': 29,
				'Cameroon': 30,
				'Canada': 31,
				'Canary Islands': 533,
				'Cape Verde': 32,
				'Caribbean Netherlands': 126,
				'Cayman Islands': 518,
				'Central African Republic': 33,
				'Ceuta and Melilla': 528,
				'Chad': 34,
				'Chile': 35,
				'China': 36,
				'Christmas Island': 491,
				'Clipperton Island': 493,
				'Cocos Islands': 507,
				'Colombia': 37,
				'Comoros': 38,
				'Congo-DRC': 471,
				'Congo-Republic': 475,
				'Cook Islands': 468,
				'Costa Rica': 41,
				'Croatia': 42,
				'Cuba': 43,
				'Curaçao': 509,
				'Cyprus': 44,
				'Czech Republic': 45,
				'Denmark': 46,
				'Diego Garcia': 531,
				'Djibouti': 47,
				'Dominica': 48,
				'Dominican Republic': 49,
				'Ecuador': 51,
				'Egypt': 52,
				'El Salvador': 53,
				'Equatorial Guinea': 54,
				'Eritrea': 55,
					'Eritrean': 55,
				'Estonia': 56,
				'Ethiopia': 57,
					'Ethiopian': 57,
				'Falkland Islands': 508,
				'Faroe Islands': 486,
				'Fiji': 58,
				'Finland': 59,
				'France': 60,
				'French Guiana': 505,
				'French Polynesia': 516,
				'French Southern Territories': 519,
				'Gabon': 61,
				'Gambia': 62,
				'Georgia': 63,
				'Germany': 64,
				'Ghana': 65,
				'Gibraltar': 514,
				'Greece': 66,
				'Greenland': 522,
				'Grenada': 67,
				'Guadeloupe': 484,
				'Guam': 492,
				'Guatemala': 68,
				'Guernsey': 515,
				'Guinea': 69,
				'Guinea-Bissau': 70,
				'Guyana': 71,
				'Haiti': 72,
				'Heard Island and McDonald Islands': 524,
				'Honduras': 73,
				'Hong Kong': 496,
				'Hungary': 74,
				'Iceland': 75,
				'India': 76,
				'Indonesia': 77,
				'Iran': 78,
				'Iraq': 79,
				'Ireland': 80,
				'Isle of Man': 500,
				'Israel': 81,
				'Italy': 82,
				'Jamaica': 84,
				'Japan': 85,
				'Jersey': 506,
				'Jordan': 86,
				'Kazakhstan': 87,
				'Kenya': 88,
				'Kiribati': 89,
				'Kosovo': 92,
				'Kuwait': 93,
				'Kyrgyzstan': 94,
				'Laos': 95,
				'Latvia': 96,
				'Lebanon': 97,
				'Lesotho': 98,
				'Liberia': 99,
				'Libya': 100,
				'Liechtenstein': 101,
				'Lithuania': 102,
				'Luxembourg': 103,
				'Macau': 483,
				'Macedonia': 104,
				'Madagascar': 105,
				'Malawi': 106,
				'Malaysia': 107,
				'Maldives': 108,
				'Mali': 109,
				'Malta': 110,
				'Marshall Islands': 112,
				'Martinique': 512,
				'Mauritania': 113,
				'Mauritius': 114,
				'Mayotte': 490,
				'Mexico': 115,
				'Micronesia': 116,
				'Moldova': 117,
				'Monaco': 118,
				'Mongolia': 119,
				'Montenegro': 111,
				'Montserrat': 481,
				'Morocco': 120,
				'Mozambique': 121,
				'Myanmar': 467,
				'Nagorno-Karabakh': 473,
				'Namibia': 123,
				'Nauru': 124,
				'Nepal': 125,
				'Netherlands': 499,
				'New Caledonia': 536,
				'New Zealand': 127,
				'Nicaragua': 128,
				'Niger': 129,
				'Nigeria': 130,
				'Niue': 510,
				'Norfolk Island': 530,
				'North Korea': 470,
				'Northern Mariana Islands': 520,
				'Norway': 131,
				'Oman': 132,
				'Pakistan': 133,
				'Palau': 134,
				'Palestine': 196,
				'Panama': 135,
				'Papua New Guinea': 136,
				'Paraguay': 137,
				'Peru': 138,
				'Philippines': 139,
				'Pitcairn Islands': 487,
				'Poland': 140,
				'Portugal': 141,
				'Puerto Rico': 534,
				'Qatar': 142,
				'Réunion': 529,
				'Romania': 143,
				'Russia': 144,
				'Rwanda': 145,
				'São Tomé and Príncipe': 151,
				'Saint Barthélemy': 521,
				'Saint Helena': 517,
				'Saint Kitts and Nevis': 472,
				'Saint Lucia': 477,
				'Saint Martin': 498,
				'Saint Pierre and Miquelon': 511,
				'Saint Vincent and the Grenadines': 148,
				'Samoa': 149,
				'San Marino': 150,
				'Saudi Arabia': 152,
				'Senegal': 153,
				'Serbia': 154,
				'Seychelles': 155,
				'Sierra Leone': 156,
				'Singapore': 157,
				'Sint Maarten': 488,
				'Slovakia': 158,
				'Slovenia': 159,
				'Solomon Islands': 160,
				'Somalia': 161,
					'Somalian': 161,
				'South Africa': 162,
				'South Georgia and the South Sandwich Islands': 527,
				'South Korea': 91,
				'South Sudan': 478,
					'South Sudanese': 478,
				'Spain': 163,
				'Sri Lanka': 164,
				'Sudan': 165,
					'Sudanese': 165,
				'Suriname': 166,
				'Svalbard and Jan Mayen': 494,
				'Swaziland': 167,
				'Sweden': 168,
				'Switzerland': 169,
				'Syria': 170,
				'Taiwan': 171,
				'Tajikistan': 172,
				'Tanzania': 173,
				'Thailand': 174,
				'Timor-Leste': 479,
				'Togo': 175,
				'Tokelau': 489,
				'Tonga': 176,
				'Transnistria': 480,
				'Trinidad and Tobago': 177,
				'Tristan da Cunha': 526,
				'Tunisia': 178,
				'Turkey': 179,
				'Turkmenistan': 180,
				'Turks and Caicos Islands': 197,
				'Tuvalu': 181,
				'U.S. Outlying Islands': 482,
				'U.S. Virgin Islands': 502,
				'Uganda': 182,
				'Ukraine': 183,
				'United Arab Emirates': 184,
				'United Kingdom': 185,
				'United States': 186,
				'Uruguay': 187,
				'Uzbekistan': 188,
				'Vanuatu': 189,
				'Vatican City': 190,
				'Venezuela': 191,
				'Vietnam': 192,
				'Wallis and Futuna': 523,
				'Western Sahara': 476,
				'Yemen': 193,
				'Zambia': 194,
				'Zimbabwe': 195,
			};
			return checkExist( obj[val], val, 'NATIONALITY'); // Default = 52 - 'Egypt'
			break;
	}
}