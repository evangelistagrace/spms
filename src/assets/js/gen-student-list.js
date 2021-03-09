/*

Script to generate student list for each course

*/

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

let ref = db.ref('/')

ref.on("value", function(snapshot) {
    let uni = snapshot.val()
    
    uni.courses.forEach((course, courseIndex) => {
        let course_total_credit_hour = 0,
            course_students = [] 

        course.semesters.forEach((sem, semIndex) => {
            let sem_students = []

            course_total_credit_hour += sem.total_credit_hour

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
                        sem_stud.subjects = []
                        sem_students.push(sem_stud)
                    }
                })

                // calculate credits and points for each student
                sem_students.forEach(stud => {
                    var index = sub.students.findIndex(x => x.id==stud.id); 
                    //increment student ch and points if they took a course
                    if (index > -1) { 
                        stud.total_credits += sub.credit_hour 
                        stud.points += sub.students[index]["score"] * sub.credit_hour //cumulative grade point
                        // to-do: add stud.subjects [{subject_name, subject_score}]
                        stud.subjects.push({id: sub.id, name: sub.name, score: sub.students[index]["score"]})
                    }
                })
            })

            // calculate gpa for each student
            sem_students.forEach(stud => {
                // gpa = total points/sem.total_credit_hour 
                stud.gpa = parseFloat(stud.points / sem.total_credit_hour).toFixed(2)
            })

            //put this student list into the current semester
            sem.students = sem_students
            db.ref(`/courses/${courseIndex}/semesters/${semIndex}`).set({
                ...sem
            })

            Object.values(sem.students).forEach(stud => {
                // generate student list for semester
                let course_stud = {};
                // generate student list
                var index = course_students.findIndex(x => x.id==stud.id); 
                if (index === -1) {
                    //init course student
                    course_stud.name = stud.name
                    course_stud.id = stud.id
                    course_stud.total_credits = 0
                    course_stud.total_points = 0
                    course_stud.cgpa = 0.0
                    // to-do: add course_stud.gpas = []
                    course_stud.gpas = []
                    course_stud.subjects = []
                    course_stud.credits = []
                    course_students.push(course_stud)
                }
            })
                
            // calculate total points and creditsfor each student
            course_students.forEach(stud => {
                var index = sem.students.findIndex(x => x.id==stud.id); 
                if (index > -1) {
                    stud.total_points += sem.students[index]["points"]
                    stud.total_credits += sem.students[index]["total_credits"]
                    stud.gpas.push(sem.students[index]["gpa"])
                    stud.subjects.push(sem.students[index]["subjects"])
                    stud.credits.push(sem.students[index]["total_credits"])
                }
            })
        })

        // calculate cgpa for each student
        course_students.forEach(stud => {
            stud.cgpa = parseFloat(stud.total_points / course_total_credit_hour).toFixed(2)
            stud.total_points = parseFloat(stud.total_points).toFixed(3)
            console.log(stud)
        })

        //put this student list into the current course
        course.students = course_students
        db.ref(`/courses/${courseIndex}`).set({
            ...course
        });
    })

}, function (error) {
   console.log("Error: " + error.code);
});
