const { spawn } = require("child_process");

exports.runInDocker = (dir, language, input) => {
  return new Promise((resolve) => {
    let args;

    
    if (language === "java") {
      args = [
        "run", "--rm", 
        "--memory=256m", "--cpus=0.5",
        "-v", `${dir}:/app`, "-w", "/app",
        "eclipse-temurin:17-jdk",
        "sh", "-c",
       
        `(echo "${input}" && javac Main.java) && echo "${input}" | java Main`
      ];
    } else if (language === "python") {
      args = [
        "run", "--rm",
        "--memory=256m", "--cpus=0.5",
        "-v", `${dir}:/app`, "-w", "/app",
        "python:3.11-slim",
        "sh", "-c", `echo "${input}" | python3 main.py`
      ];
    } else if (language === "cpp") {
      args = [
        "run", "--rm",
        "--memory=256m", "--cpus=0.5",
        "-v", `${dir}:/app`, "-w", "/app",
        "gcc:13",
        "sh", "-c",
        `(echo "${input}" && g++ -o main main.cpp) && echo "${input}" | ./main`
      ];
    }

    console.log(`🧪 Docker executing: ${language} with input: "${input}"`); // Debug

    const process = spawn("docker", args);
    let output = "", error = "";
    const startTime = Date.now();

    process.stdout.on("data", (data) => output += data.toString());
    process.stderr.on("data", (data) => error += data.toString());

    process.on("close", (code) => {
      const execTime = `${((Date.now() - startTime) / 1000).toFixed(2)}s`;
      let status = "Success";
      let finalOutput = output.trim().split('\n').pop(); // Last line = result

      console.log(`📤 Output: "${finalOutput}"`); // Debug
      console.log(`📤 Error: "${error.trim()}"`);  // Debug

      if (error.includes("error:")) status = "Compilation Error";
      else if (finalOutput.includes("Exception")) status = "Runtime Error";

      resolve({
        status,
        input,  
        expected: "", 
        output: finalOutput,
        executionTime: execTime
      });
    });
  });
};