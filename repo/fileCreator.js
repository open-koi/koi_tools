const fs = require("jsonfile");

class NodeState {
  constructor(filename) {
    if (!filename) {
      throw new Error("creating a repository requires a filename");
    }
    this.filename = filename;
    try {
      fs.accessSync(this.filename);
    } catch {
      const structure = {
        totalVoted: -1,
        reciept: [],
      };
      fs.writeFileSync(this.filename, JSON.stringify(structure, null, 2));
    }
  }
  async getAll() {
    return JSON.parse(
      await fs.promises.readFile(this.filename, {
        encoding: "utf8",
      })
    );
  }

  async writeAll(data) {
    await fs.promises.writeFile(this.filename, JSON.stringify(data, null, 2));
  }

  async getTotalVoted() {
    const data = await this.getAll();
    return data.totalVoted;
  }
  async getAllReciepts() {
    const data = await this.getAll();
    return data.reciept;
  }
  async setTotalVoted(totalVoted) {
    const data = await this.getAll();
    data.totalVoted = totalVoted;
    await this.writeAll(data);
  }
  async setReciept(reciept) {
    const data = await this.getAll();
    data.reciept.push(reciept);
    await this.writeAll(data);
  }
}

module.exports = new NodeState("node.json");
// const test = async () => {
//   const vote = new NodeState("node.json");
//   //   const get = await vote.getAll();
//   //   console.log(get);
//   //   const getTotalVoted = await vote.getTotalVoted();
//   //   console.log(getTotalVoted);
//   //   const getAllreciepts = await vote.getAllreciepts();
//   //   console.log(getAllreciepts);
//   await vote.setTotalVoted(0);

//   const getTotalVoted = await vote.getTotalVoted();
//   console.log(getTotalVoted);
//   await vote.setReciept("aijjeroai");
//   const getAllreciepts = await vote.getAllreciepts();
//   console.log(getAllreciepts);
// };
// test();
