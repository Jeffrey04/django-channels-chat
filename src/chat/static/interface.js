(() => {
  $.fn.extend({
    rdata: function (key, value) {
      if (key === undefined) {
        return $(this).data();
      } else if (value === undefined) {
        return $(this).data(key);
      } else {
        if ($.isPlainObject(key)) {
          $(this).data(key);
        } else {
          $(this).data(key, value);
        }

        $(this).trigger("rdata.render");
      }
    },
  });

  let rtemplate = function (selector) {
    return _.template($(selector).html());
  };

  let badge_generate = (count, target) =>
    $(
      rtemplate("#template-badge")({
        count: count,
      })
    ).on("rdata.render", function (e) {
      $(this).appendTo(target);
    });

  let message_generate = (message, count, target, component) =>
    $(
      rtemplate("#template-message")({
        id: message.id,
        message: message.message,
      })
    )
      .click(function (e) {
        e.preventDefault();

        component.trigger("message.react", [message]);

        return false;
      })
      .on("rdata.render", function (e) {
        $(this).appendTo(target);

        if (count > 0) {
          badge_generate(count, this).trigger("rdata.render");
        }
      });

  let message_container_generate = (messages, count, parent) =>
    $(rtemplate("#template-chats")()).on("rdata.render", function (e) {
      if (messages.length > 0) {
        $.map(messages, (item) => {
          message_generate(item, count[item.id] || 0, this, parent).trigger(
            "rdata.render"
          );
        });
      }

      $(this).appendTo(parent);
    });

  let input_generate = (message, parent, component) =>
    $(rtemplate("#template-field")({ message: message }))
      .keyup(function (e) {
        component.trigger("message.input", $(this).val());
      })
      .on("rdata.render", function (e) {
        $(this).appendTo(parent);
      });

  let button_generate = (parent, component) =>
    $(rtemplate("#template-send")())
      .click(function (e) {
        component.trigger("message.send");
      })
      .on("rdata.render", function (e) {
        $(this).appendTo(parent);
      });

  let input_container_generate = (regenerate, data, parent) =>
    $(rtemplate("#template-input")()).on("rdata.render", function (e) {
      // ugly hack to prevent regeneration to not lose focus lol
      if (regenerate) {
        input_generate(data.message || "", $(this), parent).trigger(
          "rdata.render"
        );

        button_generate($(this), parent).trigger("rdata.render");

        $(this).appendTo(parent);
      } else {
        $(parent)
          .find("input")
          .val(data.message === "\n" ? null : data.message); // ugly hack to determine whether field is cleared
      }
    });

  let = initialize = () => {
    const chat_socket_addr = "ws://"
      .concat(window.location.host)
      .concat("/ws/chat/");
    let chat_socket = new WebSocket(chat_socket_addr);

    chat_socket.onmessage = (e) => {
      content = $.parseJSON(e.data);

      if (content.type == "message") {
        $("#chats").rdata("messages", [
          content.payload,
          ...$("#chats").rdata("messages"),
        ]);
      } else if (content.type == "react") {
        $("#chats").rdata("count", {
          ...$("#chats").rdata("count"),
          [content.payload.message_id]: content.payload.count,
        });
      }
    };

    chat_socket.onclose = (e) => {
      setTimeout(function () {
        console.log("reconnecting");
        chat_socket = new WebSocket(chat_socket_addr);
      }, 1000);
    };

    $("#chats")
      .data({
        messages: [],
        count: {},
      })
      .on("message.react", function (event, message) {
        chat_socket.send(
          JSON.stringify({
            type: "react",
            message_id: message.id,
          })
        );
      })
      .on("rdata.render", function (event) {
        $(this).empty();

        message_container_generate(
          $(this).data("messages"),
          $(this).data("count"),
          $(this)
        ).trigger("rdata.render");
      });

    $("#input")
      .data({
        message: null,
      })
      .on("message.send", function (event) {
        chat_socket.send(
          JSON.stringify({
            type: "message",
            message: $(this).data("message"),
          })
        );

        $(this).rdata("message", "\n");
      })
      .on("message.input", function (event, text) {
        $(this).rdata("message", text);
      })
      .on("rdata.render", function (event, field) {
        $(this);

        input_container_generate(
          $(this).children().length === 0,
          $(this).rdata(),
          $(this)
        ).trigger("rdata.render");
      });

    $(".component").trigger("rdata.render");
  };

  $(initialize);
})();
