var express = require("express");
var app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", "./views");
var server = require("http").Server(app);
var io = require("socket.io")(server);
const axios = require("axios");
server.listen(3000);
const API_URL = "https://us-central1-faco-4ace5.cloudfunctions.net/graphql";

let capNhatTaiKhoan = `mutation capNhatTaiKhoan(
    $Id: String!,
    $Email: String,
    $Humidity: Float,
    $Temperature: Float
) {
    capNhatTaiKhoan(
        Id: $Id,
        Email: $Email,
        Humidity: $Humidity,
        Temperature: $Temperature
    ) {
        Id Email Temperature Humidity
    }
}`;

let capNhatTrangThaiThietBi = `mutation capNhatTrangThaiThietBi(
  $UserId: String!,
  $DeviceId: String!,
  $AutoStatus: Boolean!
) {
  capNhatTrangThaiThietBi(
    UserId: $UserId,
    DeviceId: $DeviceId,
    AutoStatus: $AutoStatus
  ) {
    AutoStatus
  }
}`;

let kiemTraThietBiTonTaiChua = `query kiemTraThietBiTonTaiChua(
  $UserId: String!,
  $DeviceId: String!
) {
  kiemTraThietBiTonTaiChua(
    UserId: $UserId,
    DeviceId: $DeviceId
  ) {
    Id
  }
}`;

let options = {
  headers: {
    "Content-Type": "application/json",
  },
};

io.on("connect", function (socket) {
  console.log("co nguoi ket noi id =", socket.id);

  // Kiểm tra tồn tại mà ESP gửi đến
  socket.on("cKTTTs", function (data) {
    axios
      .post(
        API_URL,
        {
          query: kiemTraThietBiTonTaiChua,
          variables: {
            UserId: data.userId,
            DeviceId: data.deviceId,
          },
        },
        options
      )
      .then((val) => {
        if (val.data.data.kiemTraThietBiTonTaiChua != null) {
          socket.userId = data.userId;
          socket.deviceId = data.deviceId;

          console.log("cKTTTs - da co thiet bi: ", socket.deviceId);
          console.log(
            "cKTTTs - da co thiet bi: ",
            val.data.data.kiemTraThietBiTonTaiChua.Id
          );

          io.to(socket.id).emit("sKTTTc", "1");
        } else {
          console.log("cKTTTs - NO da co thiet bi: ", data.deviceId);
          console.log(val.data.data.kiemTraThietBiTonTaiChua);

          io.to(socket.id).emit("sKTTTc", "0");
        }
      });
  });

  socket.on("DataObj", function (data) {
    // console.log(typeof data);
    // var dataObj = JSON.parse(data);

    socket.userId = data.userId;
    socket.deviceId = data.deviceId;
    console.log("connected userId =", socket.userId);
    console.log("connected deviceId =", socket.deviceId);

    axios
      .post(
        API_URL,
        {
          query: capNhatTrangThaiThietBi,
          variables: {
            UserId: socket.userId,
            DeviceId: socket.deviceId,
            AutoStatus: true,
          },
        },
        options
      )
      .then((_) => {
        console.log("on:", socket.deviceId);
      });
  });

  socket.on("disconnect", () => {
    console.log("off id =", socket.id);
    console.log("disconnected userId =", socket.userId);
    console.log("disconnected deviceId =", socket.deviceId);

    axios
      .post(
        API_URL,
        {
          query: capNhatTrangThaiThietBi,
          variables: {
            UserId: socket.userId,
            DeviceId: socket.deviceId,
            AutoStatus: false,
          },
        },
        options
      )
      .then((_) => {
        console.log("off:", socket.deviceId);
      });
  });
});

app.get("/", function (req, res) {
  res.render("trangchu");
});
