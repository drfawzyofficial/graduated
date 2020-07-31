$(() => {
    function success() {
        $(".notificationSuccess")
            .html(
                `
 <div class="cancelNotificationSuccess text-white" id="cancelNotificationSuccess">x</div>
<audio autoplay class="d-none">
<source src="
/assets/sounds/notification.mp3" type="audio/mpeg">
</audio>
<h4 class="text-white">Notification</h4>
<p class="mb-0 text-white" style="font-size: 14px">${ data.msgUser}</p>
 `
            )
            .show(100)
            .delay(5000)
            .hide(100);
    }
    function error() {
        $(".notificationError")
            .html(
                `
 <div class="cancelNotificationError text-white" id="cancelNotificationError">x</div>
<audio autoplay class="d-none">
<source src="
/assets/sounds/notification.mp3" type="audio/mpeg">
</audio>
<h4 class="text-white">Notification</h4>
<p class="mb-0 text-white" style="font-size: 14px; color: white">${ data.msgUser}</p>
 `
            )
            .show(100)
            .delay(5000)
            .hide(100);
    }
    function handleResponse(response) {
        return response.json();
    }
    $("#publishCourse").click(() => {
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                coursename: $("#coursename").val(),
                coursecontent: $(".ql-editor").html(),
                courseprice: $("#courseprice").val(),
                limitedUsers: $("#limitedUsers").val(),
                coursestart: $("#coursestart").val(),
                courseend: $("#courseend").val(),
                centerlocation: $("#centerlocation").val(),
                centerplace: $("#centerplace").val()
            }),
        }
        fetch("/seso/publish", requestOptions)
            .then(handleResponse)
            .then((data) => {
                console.log(data)
                if (data.statusCode != 200) {
                    error()
                } else {
                    success();
                }
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    })

    $(".removeCourse").click((event) => {
        const courseID = $(event.target).attr("data-courseid");
        const requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                courseID: courseID
            }),
        }
        fetch(`/seso/control/removeCourse`, requestOptions)
        .then(handleResponse)
        .then((data) => {
            console.log(data)
            if (data.statusCode != 200) {
                error()
            } else {
                success();
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
    })
})