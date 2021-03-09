const firebaseConfig = {
    apiKey: "AIzaSyCuPNvg0Dittv2j6WZmQNr37WRhXhbR-IA",
    authDomain: "students-progress-monitoring.firebaseapp.com",
    databaseURL: "https://students-progress-monitoring-default-rtdb.firebaseio.com",
    projectId: "students-progress-monitoring",
    storageBucket: "students-progress-monitoring.appspot.com",
    messagingSenderId: "1055641208883",
    appId: "1:1055641208883:web:3b7095ee0e01500f08fb46"
},
app = firebase.initializeApp(firebaseConfig),
db = app.database()

let params = getParams(window.location.href)

console.log(params.id)

let ref = db.ref('/courses/0/students'),
	student

// get requested student from db
ref.once('value').then(snapshot => {
	let students = snapshot.val()
	students.forEach(stud => {
		if (stud.id == params.id) {
			student = stud
			console.log(student)
		}
	})

	// display student's details
	let studentName = document.getElementById('studentName'),
		studentId = document.getElementById('studentId'),
		studentId2 = document.getElementById('studentId2'),
		studentCgpa = document.getElementById('studentCgpa')

	studentName.innerHTML = student.name
	studentId.innerHTML = student.id
	studentId2.innerHTML = student.id
	studentCgpa.innerHTML = student.cgpa

	// display student's subjects and grades
	let studentSubjectsTable = document.getElementById('studentSubjects'),
    	studentSubjectsTableBody= studentSubjectsTable.getElementsByTagName('tbody')

	student.subjects.forEach(sem => {
		sem.forEach(sub => {
			// generate rows for each subject
			let id = sub.id,
				name = sub.name,
				score = sub.score,
				grade = "",
				remark = "-",
				tr = document.createElement('tr')

			switch (score) {
				case 4:
					grade = "A"
					remark = '<span class="text text-success">Pass</span>'
					break
				case 3.67:
					grade = "A-"
					remark = '<span class="text text-success">Pass</span>'
					break
				case 3.33:
					grade = "B+"
					remark = '<span class="text text-success">Pass</span>'
					break
				case 3:
					grade = "B"
					remark = '<span class="text text-success">Pass</span>'
					break
				case 2.67:
					grade = "B-"
					remark = '<span class="text text-warning">At risk</span>'
					break
				case 2.33:
					grade = "C+"
					remark = '<span class="text text-warning">At risk</span>'
					break
				case 2:
					grade = "C"
					remark = '<span class="text text-warning">At risk</span>'
					break
				case 1.67:
					grade = "C-"
					remark = '<span class="text text-danger">Fail</span>'
					break
				case 1.33:
					grade = "D+"
					remark = '<span class="text text-danger">Fail</span>'
					break
				case 1:
					grade = "D"
					remark = '<span class="text text-danger">Fail</span>'
					break
				case 0:
					grade = "F"
					remark = '<span class="text text-danger">Fail</span>'
					break
				default:
					break
			}

			tr.innerHTML = `<td>${id}</td>` +
			`<td>${name}</td>` +
			`<td>${grade}</td>` +
			`<td>${remark}</td>` 

			studentSubjectsTableBody[0].appendChild(tr)
			
		})
	})

	// set chart
	var ctx = document.getElementById('gpaChart').getContext('2d');
	var chart = new Chart(ctx, {
		// The type of chart we want to create
		type: 'line',

		// The data for our dataset
		data: {
			labels: ['Semester 1', 'Semester 2', 'Semester 3'],
			datasets: [{
				borderColor: 'rgb(248, 189, 122)',
				data: [student.gpas[0], student.gpas[1], student.gpas[2]],
				borderWidth: 5
			}],
		},

		// Configuration options go here
		options: {
			legend: {
				display: false
			}
		}
	});
})


function getParams (url) {
	var params = {};
	var parser = document.createElement('a');
	parser.href = url;
	var query = parser.search.substring(1);
	var vars = query.split('&');
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split('=');
		params[pair[0]] = decodeURIComponent(pair[1]);
	}
	return params;
};