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

let ref = db.ref('/courses/0/semesters/0')

// display data in student list card
let studentListTable = document.getElementById('studentListTable'),
    studentListTableBody = studentListTable.getElementsByTagName('tbody'),
    studentArr = []

ref.on('value', (snapshot) => {
    let sem = snapshot.val()

    sem.students.forEach(stud => {
        studentArr.push(stud)
    })
})

setTimeout(() => {
    studentArr.forEach(stud => {
        let id = stud.id,
            name = stud.name,
            cgpa = parseFloat(stud.gpa).toFixed(2),
            status = "Active",
            tr = document.createElement('tr')

        tr.innerHTML = `<td>${id}</td><td>${name}</td><td>${cgpa}</td><td><span class="text text-success">${status}</span></td>`
        studentListTableBody[0].appendChild(tr)
    })
}, 3000)

