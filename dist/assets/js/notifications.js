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

let ref = db.ref('/courses/0/notifications'), 
    notifcationsContainer = document.getElementById('notificationsContainer')

let notifications = []

displayNoti()
// resetNotifications()

function displayNoti() {

    ref.once('value').then(snapshot => {
        // init notifications
        notifications = snapshot.val()
    
    }).then(() => {
    
        // generate notifications
        //only call this after db has loaded
        console.log(notifications)
        //clear existing display
        notifcationsContainer.innerHTML = ''

        notifications.forEach((noti, notiIndex) => {

            //return early if noti is already 'read'
            if (noti.status == "read") return
            
            let row = document.createElement('div'),
                icon = noti.type == 'warning' ? '<span class="fas fa-exclamation-triangle"></span>' : '<span class="fas fa-exclamation-circle"></span>'

            row.innerHTML =  `<div class="row justify-content-md-center">` + 
            `<div class="col-8 mb-2">` +
            `<div id="${notiIndex}" class="card border-light shadow-sm">` +
            `<div class="card-body">` +
            `<h4 class="h4 text text-${noti.type}">${icon} ${noti.title}</h4>` +
            `<span style="line-height:3">${noti.message}</span>` +
            `<div class="" style="float:right">` +
            `<a class="btn btn-dark" type="button" href="${noti.viewLink}">View</a>&nbsp;` +
            `<button class="btn btn-secondary dismiss" type="button">Dismiss</button>` +
            `</div>` +
            `</div>` +
            `</div>` +
            `</div>` + 
            `</div>`

            notifcationsContainer.appendChild(row)
        })

        //attach click listeners
        attachDismissNotiListener()
    })

    function attachDismissNotiListener() {
        let dismissBtns = document.querySelectorAll('button.dismiss')
    
        Array.from(dismissBtns).forEach(btn => {
            btn.addEventListener('click', (e) => {
                let parent = e.currentTarget.parentElement.parentElement.parentElement
    
                console.log(parent.id)
                //set noti to 'read'
                db.ref(`/courses/0/notifications/${parent.id}`).once('value').then((snapshot) => {
                    let currentNoti = snapshot.val()
                    currentNoti.status = "read"
                    db.ref(`/courses/0/notifications/${parent.id}`).set({
                        ...currentNoti
                    }).then(() => {
                        console.log('refrseh view')
                         // refresh view
                        displayNoti()
                    })
                    
                })
            })
        })
    }
}

function resetNotifications() {
    ref.once('value').then(snapshot => {
        // init notifications
        notifications = snapshot.val()
    
    }).then(() => {
        notifications.forEach((noti, index) => {
            noti.status = "unread"
            db.ref(`/courses/0/notifications/${index}`).set({
                ...noti
            })
        })
    
       // refresh view
       displayNoti()
    })
}


