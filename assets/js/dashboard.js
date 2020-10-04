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
<p class="mb-0 text-white" style="font-size: 14px">${ data.msgUser}</p>
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
                coursestart: $(".coursestart").val(),
                courseend: $(".courseend").val(),
                centerlocation: $("#centerlocation").val(),
                centerplace: $("#centerplace").val()
            }),
        }
        fetch("/dashboard/publish", requestOptions)
            .then(handleResponse)
            .then((data) => {
                console.log(data)
                if (data.statusCode != 200) {
                    error(data)
                } else {
                    success(data);
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
        fetch(`/dashboard/control/removeCourse`, requestOptions)
            .then(handleResponse)
            .then((data) => {
                if (data.statusCode != 200) {
                    error(data)
                } else {
                    success(data);
                    $(event.target).parent().parent().parent().parent().hide(250)
                }
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    })

    $(".makeRequest").click((event) => {
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
        fetch(`/dashboard/balance/makeRequest`, requestOptions)
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



    $(".editCourse").on("submit", function (event) {
        $(event.target).find('.hiddenArea').val($(event.target).find(".ql-editor").html())
    })
    const coursesName = [];
    const courseNumbers = [];
    const courseUsers = [];

    (async () => {
        const requestOptions = {
            method: "POST",
            headers: {
                "Accept": "application/json",
            }
        }
        let response = await fetch(`/dashboard/chart`, requestOptions);
        let data = await response.json();
        if (data.statusCode != 200) {
            error(data)
        } else {
            $.each(data.courses, (index, data) => {
                coursesName.push(data.coursename);
                courseNumbers.push(index + 1);
                courseUsers.push(data.users.length);
            })
            var dataCourses = {
                labels: coursesName,
                series: [
                    courseNumbers,
                    courseUsers
                ]
            }

            var optionChartCourses = {
                plugins: [
                    Chartist.plugins.tooltip()
                ],
                seriesBarDistance: 10,
                axisX: {
                    showGrid: false
                },
                height: "245px",
            }

            var responsiveChartCourses = [
                ['screen and (max-width: 640px)', {
                    seriesBarDistance: 5,
                    axisX: {
                        labelInterpolationFnc: function (value) {
                            return value[0];
                        }
                    }
                }]
            ];

            Chartist.Bar('#coursesChart', dataCourses, optionChartCourses, responsiveChartCourses);
        }
    })()

    $("body").on("click", ".cancelNotificationSuccess", () => {
        $(".notificationSuccess").hide();
    })

    $("body").on("click", ".cancelNotificationError", () => {
        $(".notificationError").hide();
    })




})