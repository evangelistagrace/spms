
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

// find selected course
let courses = document.getElementById('courses'),
    navLinks = document.querySelectorAll('.nav-link'),
    params = getParams(window.location.href)

// set dropdown
if (params.course != undefined) {
    courses.value = params.course //get course id from url param
} else {
    courses.value = 0 //software engineering is default option
}

// set menu links
Array.from(navLinks).forEach((nav) => {
    if (nav.href.toString().includes('course')) {
        // replace course param value
        nav.href = nav.href.toString().replace(/course=([^&#]*)/g, `course=${courses.value}`)
    } else {
        nav.href += `?course=${courses.value}`
    }
    // nav.href += `?course=${courses.value}`
    console.log(nav.href)
})

init()

courses.addEventListener('change', () => {
    console.log('selected course ' + courses.value)

    // set menu links
    Array.from(navLinks).forEach((nav) => {
        if (nav.href.toString().includes('course')) {
            // replace course param value
            nav.href = nav.href.toString().replace(/course=([^&#]*)/g, `course=${courses.value}`)
        } else {
            nav.href += `?course=${courses.value}`
        }
        // nav.href += `?course=${courses.value}`
        console.log(nav.href)
    })

    init()
})

function init() {
    let ref = db.ref(`/courses/${courses.value}`)

    // display data in student list card
    let studentListTable = document.getElementById('studentListTable'),
        studentListTableBody = studentListTable.getElementsByTagName('tbody'),
        studentListTitle = document.getElementById('studentListTitle') || null,
        avgGpaChartTtitle = document.getElementById('avgGpaChartTitle') || null,
        notifications = [],
        semesters = [],
        students = [],
        courseNotifications = [],
        averageGPAS = [],
        course,
        ctx

    studentListTableBody[0].innerHTML = ''

    // init students and semesters
    ref.once('value').then(snapshot => {
        course = snapshot.val()
            
        if (course.notifications != undefined) courseNotifications = course.notifications
        
        semesters = course.semesters
        students = course.students

    }).then(() => {

        if (studentListTitle != null) {
            studentListTitle.innerHTML = `${course.id} ${course.name} - Student List`
        }

        if (avgGpaChartTtitle != null) {
            avgGpaChartTtitle.innerHTML = `${course.id} ${course.name}`
        }
        
        // call this only after db is loaded
        students.forEach(stud => {
            let id = stud.id,
                name = stud.name,
                cgpa = stud.cgpa,
                tr = document.createElement('tr'),
                status = cgpa >= 3.00 ? "Active" : cgpa >= 2.00 ? "At risk" : "Critical",
                spanClass = cgpa >= 3.00 ? "text text-success" : cgpa >= 2.00 ? "text text-warning" : "text text-danger",
                link = `/pages/student?course=${courses.value}&id=${id}`

            tr.innerHTML = `<td>${id}</td><td><a href="${link}">${name}</a></td><td>${cgpa}</td><td><span class="${spanClass}">${status}</span></td>`
            studentListTableBody[0].appendChild(tr)

            // generate notifications only once 
            if (courseNotifications.length == 0) {
                //check for student with low cgpa
                checkCGPA(stud)

                //check for student with low credit hour for several semesters
                checkCH(stud)
            }
            
        })

        if (courseNotifications.length == 0) {
            console.log(notifications)
            //push notifcations to db
            db.ref(`/courses/${courses.value}/notifications`).set(notifications)
        }

        // calculate average GPA by semester and display in chart
        genChart()
    })


    function checkCGPA(stud) {
        let notification = {} // notification.title, notification.message, notification.type, notification.status

        if (stud.cgpa < 2.00) {
            notification.title = "CGPA at risk"
            notification.message = `Student ${stud.id} has a low CGPA of ${stud.cgpa}`
            notification.type = "danger"
        } else if (stud.cgpa < 3.00) {
            notification.title = "Low CGPA"
            notification.message = `Student ${stud.id} has a low CGPA of ${stud.cgpa}`
            notification.type = "warning"
        }

        if (!isEmpty(notification)) {
            notification.status = "unread"
            notification.viewLink = `/pages/student?course=${courses.value}&id=${stud.id}`
            notifications.push(notification)
        }
    }

    function checkCH(stud) {
        let notification = {}, // notification.title, notification.message, notification.type, notification.status
            count = 0

        semesters.forEach((sem, index) => {
            if (stud.credits[index] < sem.total_credit_hour) {
                count++
            }
        })

        if (count >= 2) {
            notification.title = "Insufficient credit hours taken"
            notification.message = `Student ${stud.id} has taken insufficient credit hours for ${count} semesters`
            notification.type = "warning"
            notification.status = "unread"
            notification.viewLink = `/pages/student?course=${courses.value}&id=${stud.id}`
            notifications.push(notification)
        }
    }

    function genChart() {
        // calculate average gpa by semester
        for(let i=0;i<semesters.length;i++) {
            let semGPA = 0.0

            students.forEach((stud, index) => {
                let gpa = parseFloat(stud.gpas[i])
                
                semGPA += gpa
            })

            semGPA = parseFloat(semGPA/students.length).toFixed(2)
            averageGPAS.push(semGPA)
        }

        // set chart

        ctx = document.getElementById('gpaChart').getContext('2d')
        if (ctx != null) {
            var chart = new Chart(ctx, {
                // The type of chart we want to create
                type: 'line',
    
                // The data for our dataset
                data: {
                    labels: ['Semester 1', 'Semester 2', 'Semester 3'],
                    datasets: [{
                        borderColor: 'rgb(248, 189, 122)',
                        data: averageGPAS,
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
        }
    }

    function isEmpty(obj) {
        return Object.keys(obj).length === 0;
    }
}

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



