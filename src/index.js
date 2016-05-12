var test = "test";

async function testFunc() {
  await setTimeout(() => console.log(test), 100);
  test = "soidngdifuapnhdifh";
}

testFunc();