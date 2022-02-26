const axios = require("axios");

const stakingAddress = "";
const stakingSEED = "";

function getCall(address, key) {
  return axios({
    method: "get",
    async: false,
    url:
      "https://cluster.node.turtlenetwork.eu/addresses/data/" +
      address +
      "/" +
      key,
  });
}

//move over data and create tokens
async function getData() {
  try {
    const { data: minimumTreshold } = await getCall(
      stakingAddress,
      "global_lastCheck_interest"
    );
    this.minimumThreshold = minimumTreshold;
  } catch (e) {
    this.minimumThreshold = {
      key: "global_lastCheck_interest",
      type: "integer",
      value: 1,
    };
  }

  if (this.minimumThreshold.value == 0) {
    this.minimumThreshold.value == 1;
  }

  //console.log("1: ", this.minimumThreshold);

  const dataTx = data(
    {
      additionalFee: 400000,
      data: [this.minimumThreshold],
    },
    stakingSEED
  );
  broadcast(dataTx).catch((e) => console.log(e));
}

getData();
