
const firebase = require('firebase'),
    fs = require('fs-extra'),
    app = firebase.initializeApp({
        apiKey: "AIzaSyCuPNvg0Dittv2j6WZmQNr37WRhXhbR-IA",
        authDomain: "students-progress-monitoring.firebaseapp.com",
        databaseURL: "https://students-progress-monitoring-default-rtdb.firebaseio.com",
        projectId: "students-progress-monitoring",
        storageBucket: "students-progress-monitoring.appspot.com",
        messagingSenderId: "1055641208883",
        appId: "1:1055641208883:web:3b7095ee0e01500f08fb46"
    }),
    db = app.database()

let ref = db.ref('/courses/0/semesters/0')

ref.on("value", function(snapshot) {
   let sem = snapshot.val(),
       sem_students = []

   Object.values(sem.subjects).forEach(sub => {
      // generate student list for semester
       sub.students.forEach(stud => {
           let sem_stud = {};
             // generate student list
            var index = sem_students.findIndex(x => x.id==stud.id); 
            if (index === -1) {
                //init sem student
                sem_stud.name = stud.name
                sem_stud.id = stud.id
                sem_stud.points = 0.0
                sem_stud.total_credits = 0
                sem_stud.gpa = 0.0
                sem_students.push(sem_stud)
            }
       })

       // calculate credits and points for each student
       sem_students.forEach(stud => {
            var index = sub.students.findIndex(x => x.id==stud.id); 
            //increment student ch and points if they took a course
            if (index > -1) { 
                stud.total_credits += sub.credit_hour 
                stud.points += sub.students[index]["score"] * sub.credit_hour
            }
        })
   })

   // calculate gpa for each student
   sem_students.forEach(stud => {
       // gpa = total points/sem.total_credit_hour 
       stud.gpa = parseFloat(stud.points / sem.total_credit_hour)
   })

   //put this student list into the current semester
   sem.students = sem_students
   db.ref('/courses/0/semesters/0').set({
       ...sem
    });

}, function (error) {
   console.log("Error: " + error.code);
});
  
