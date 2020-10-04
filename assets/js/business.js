$(() => {
    function success(data) {
        $(".notificationSuccess")
            .html(
                `
 <div class="cancelNotificationSuccess text-white" id="cancelNotificationSuccess">x</div>
<audio autoplay class="d-none">
<source src="
/assets/sounds/notification.mp3" type="audio/mpeg">
</audio>
<h4 class="text-white">Notification</h4>
<p class="mb-0 text-white" style="font-size: 14px">${ data.msgUser }</p>
 `
            )
            .show(100)
            .delay(5000)
            .hide(100);
    }
    function error(data) {
        $(".notificationError")
            .html(
                `
 <div class="cancelNotificationError text-white" id="cancelNotificationError">x</div>
<audio autoplay class="d-none">
<source src="
/assets/sounds/notification.mp3" type="audio/mpeg">
</audio>
<h4 class="text-white">Notification</h4>
<p class="mb-0 text-white" style="font-size: 14px; color: white">${ data.msgUser }</p>
 `
            )
            .show(100)
            .delay(5000)
            .hide(100);
    }
    function handleResponse(response) {
        return response.json();
    }

    $(".completedTransaction").click((event) => {
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
        fetch(`/profile/completedProcess`, requestOptions)
        .then(handleResponse)
        .then((data) => {
            if (data.statusCode != 200) {
                error(data)
            } else {
                success(data);
                setTimeout(() => {
                    location.reload(true)
                }, 5000)
            }
        })
        .catch((error) => {
            console.error("Error:", error);
        });
    })


    
})