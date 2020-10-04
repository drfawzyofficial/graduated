$(() => {

	$(".centerBox").animate({ scrollTop: 20000000 }, "slow");

	const socket = io();


	// If socket is disconnected
	socket.on('disconnect', () => {
		$('#message').prop('disabled', true);
		$('#message').prop('placeholder', "Connection Lost! Reconnecting...");
	});

	// If socket is reconnected
	socket.on('reconnect', function () {
		setTimeout(() => {
			$('#message').prop('disabled', false);
			$('#message').prop('placeholder', "Type your message..");
		}, 4000);
	});

	// If socket is reconnect_failed
	socket.on('reconnect_failed', function () {
		$('#message').prop('placeholder', "No active connection. Please refresh page...");
	});



	// clientMessage
// 	const clientMessage = (msg) => {
// 		$(".messages").append(`
// 	<div class="ClientMessage mt-2 d-flex animated bounceIn">
// 		<div class="ClientImage">
// 			<img title="botImage" alt="botImage" src="/assets/Images/Avatar/User.png" style="height: 50px; width: 50px; border-radius: 50%;"/>
// 		</div>
// 		<div class="ClientContent bg-light p-2 ml-2" style="border-radius: 4px; width: calc(100% - 50px)">
// 			<h6>User</h6>
// 			<p class="mb-0" style="font-size: 14px">${ msg}</p>
// 			<span class="bot_timestamp" style="font-size: 12px">${ moment(Date.now()).fromNow()} </span>
// 		</div>
// 	</div>
// `);
// 		$(".messages").animate({ scrollTop: 20000000 }, "slow");
// 		$(".inputMessage").val("").focus();
// 	}


	socket.on('userConnected', (data) => {
		$(".messages").append(`
			<div class="adminConnected mt-2 animated bounceIn text-center">
				<p style="font-size: 12px">${ data.msg }</p>
			</div>
		`);
	});

	socket.on('leaving', (data) => {
		if(data.leavingFrom === "Admin")  {
			$(".messages").append(`
			<div class="adminLeft mt-2 animated bounceIn text-center">
				<p style="font-size: 12px">${ data.msg }</p>
			</div>
		`);
		}
	});

	$('.closeChatArea').click(() => {
		$('.chatArea').hide(250);
		$(".openBox").addClass("animated");
	});

	$('.custom-control-input').on('click', () => {
		localStorage.setItem("chatSound", !chatSound);
		chatSound = !chatSound
	})

	// Send message to the admin if there is roomID. if there is not roomID, the botter will speak
	$('.inputMessage').keypress((e) => {
		if (e.which !== 13) {
			if (roomID) {
				if ($('.inputMessage').is(":focus")) isTyping();
				else isnotTyping();
			}
		} else {
			if ($('.inputMessage').val().trim()) {
				if (roomID) {
					sendMessage();
					isnotTyping();
				} else {
					clientMessage($('.inputMessage').val());
				}
			}


		}
	})

	// specify the typting
	socket.on('typing', (data) => {
		if (data.isTyping && data.person === 'Admin')
			$(".typing").text("Admin is typing...");
		else
			$(".typing").text('');
	});


	// exchange the message
	socket.on('chatMessage', function (data) {
		if (data.isAdmin)
			sender = "Admin"
		else
			sender = "User"

		$(".messages").append(`
			<div class="${ sender }Message mt-2 d-flex animated bounceIn">
					${ chatSound && sender === "Admin" ? `<audio class="d-none" controls autoplay>
				<source src="/assets/sounds/notify.ogg" type="audio/ogg">
				<source src="/assets/sounds/notify.mp3" type="audio/mpeg">
				Your browser does not support the audio element.
				</audio>` : ''}
				<div class="${ sender }Image">
					<img title="botImage" alt="botImage" src="/assets/Images/Avatar/${ sender }.png" style="height: 50px; width: 50px; border-radius: 50%;"/>
				</div>
				<div class="${ sender }Content bg-light p-2 ml-2" style="border-radius: 4px; width: calc(100% - 50px)">
					<h6>${ sender}</h6>
					<p class="mb-0" style="font-size: 14px">${ data.message }</p>
					<span class="bot_timestamp" style="font-size: 12px">${ moment(data.createdAt).fromNow() } </span>
				</div>
			</div>
		`);
		$(".messages").animate({ scrollTop: 20000000 }, "slow");
	});

	const isTyping = () => {
		socket.emit("typing", {
			isTyping: true,
			roomID: roomID,
			person: "User"
		});
	}

	const isnotTyping = () => {
		socket.emit("typing", {
			isTyping: false,
			roomID: roomID,
			person: "User"
		});
	}

	const sendMessage = () => {
		if ($('.inputMessage').val().trim()) {
			socket.emit('chatMessage', {
				roomID: roomID,
				message: $('.inputMessage').val().trim(),
				createdAt: new Date()
			});
			$('.inputMessage').val('').focus();
		}
	}

})