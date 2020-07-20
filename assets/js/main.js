$(() => {
    // Scroll Event
    $(window).on("scroll", function () {
        var scrolled = $(window).scrollTop();
        if (scrolled > 600) $(".go-top").addClass("active");
        if (scrolled < 600) $(".go-top").removeClass("active");
    });
    // Click Event
    $(".go-top").on("click", function () {
        $("html, body").animate({ scrollTop: "0" }, 500);
    });

    // Scroll to links
    $("#aboutLink").click(() => {
        $('html, body').animate({
            scrollTop: $("#About").offset().top - 70
        });
    });
    $("#featuresLink").click(() => {
        $('html, body').animate({
            scrollTop: $("#Features").offset().top - 70
        });
    });
    $("#servicesLink").click(() => {
        $('html, body').animate({
            scrollTop: $("#Services").offset().top - 70
        });
    });
    $("#faqLink").click(() => {
        $('html, body').animate({
            scrollTop: $("#FAQ").offset().top - 70
        });
    });

    // FAQ Accordion
    $(".accordion")
        .find(".accordion-title")
        .on("click", function () {
            // Adds Active Class
            $(this).toggleClass("active");
            // Expand or Collapse This Panel
            $(this).next().slideToggle("fast");
            // Hide The Other Panels
            $(".accordion-content").not($(this).next()).slideUp("fast");
            // Removes Active Class From Other Titles
            $(".accordion-title").not($(this)).removeClass("active");
        });

    $(window).click(function (e) {
        if ($(".navbar-collapse").hasClass("show")) {
            $(".navbar-collapse").collapse("hide");
            e.preventDefault();
        }
    });

    $(window).on("scroll", () => {
        if ($(this).scrollTop() > 220) {
            $(".headerContent")
                .removeClass("pageTatx")
                .addClass("bg-white o_shadow animated fadeInDown");
        } else {
            $(".headerContent")
                .removeClass("bg-white o_shadow animated fadeInDown")
                .addClass("pageTatx");
        }
    });

    $("#hlot").click(() => {
        $("#login").modal("hide");
        $("#terms").modal("show");
        $("#body").addClass("modal-open");
    });

    $("#hlos").click(() => {
        $("#login").modal("hide");
        $("#send").modal("show");
        $("#body").addClass("modal-open");
    });

    $("#contactForm").submit((e) => {
        e.preventDefault();
        fetch("/contact", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: $("#emailContact").val(),
                problem: $("#problemContact").val(),
                message: $("#messageContact").val(),
            }),
        })
            .then((response) => response.json())
            .then((data) => {
                $(".notification")
                    .html(
                        `
                 <div class="cancelNotification text-white" id="cancelNotification">x</div>
            <audio autoplay class="d-none">
                <source src="
                /assets/sounds/notification.mp3" type="audio/mpeg">
             </audio>
            <h4>Notification</h4>
            <p class="mb-0" style="font-size: 14px">${data.msg}</p>
                 `
                    )
                    .show(100)
                    .delay(5000)
                    .hide(100);
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    })

    $("body").on("click", ".cancelNotification", () => {
        $(".notification").hide();
    })
});

