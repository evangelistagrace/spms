
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

let ref = db.ref('/courses/0')

// display data in student list card
let studentListTable = document.getElementById('studentListTable'),
    studentListTableBody = studentListTable.getElementsByTagName('tbody'),
    studentArr = [],
    notifications = [],
    semesters = [],
    students = [],
    courseNotifications = []

// init students and semesters
ref.once('value').then(snapshot => {
    let course = snapshot.val()
        
    courseNotifications = course.notifications

    semesters = course.semesters
    students = course.students

}).then(() => {
    // call this only after db is loaded
    students.forEach(stud => {
        let id = stud.id,
            name = stud.name,
            cgpa = stud.cgpa,
            tr = document.createElement('tr'),
            status = cgpa >= 3.00 ? "Active" : cgpa >= 2.00 ? "At risk" : "Critical",
            spanClass = cgpa >= 3.00 ? "text text-success" : cgpa >= 2.00 ? "text text-warning" : "text text-danger",
            link = `/pages/student?id=${id}`

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
        db.ref(`/courses/0/notifications`).set(notifications)
    }
    
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
        notification.viewLink = `/pages/student?id=${stud.id}`
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
        notification.viewLink = `/pages/student?id=${stud.id}`
        notifications.push(notification)
    }
}

function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}

