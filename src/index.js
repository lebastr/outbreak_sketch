import p5 from "p5";

const sketch = p5 => {
  let Height = 600;
  let Width = 600;
  
  let N = 100;
  
  let Xs = new Float64Array(N);
  let Ys = new Float64Array(N);
  let Vxs = new Float64Array(N);
  let Vys = new Float64Array(N);
  let Is_ill = new Int8Array(N);
  let Last_illness_time = new Float64Array(N);
  let Disease_duration = 50;
  let Virulence = 0.01;
  let maxSpeed = 10;
  let dT = 0.1;
  let T = 0.0;
  let eps = 5.0;

  let IllCounter = 1;
  Is_ill[0] = true;

  for(let i = 0; i < N; i++) {
    Xs[i] = p5.random(0, Width);
    Ys[i] = p5.random(0, Height);
    let angle = p5.random(0, 2*p5.PI);
    Vxs[i] = maxSpeed * p5.cos(angle);
    Vys[i] = maxSpeed * p5.sin(angle);
  }

  p5.setup = function() {
    p5.createCanvas(Width, Height);
    p5.background(0, 0, 0);
  };

  p5.draw = function() {
    p5.background(0, 0, 0);
    
    for(let i = 0; i < Xs.length; i++) {
      let color;
      if (Is_ill[i]) {
        color = [255,0,0];
      } else {
        color = [0,255,0];
      }

      p5.fill(color);
      p5.circle(Xs[i], Ys[i], eps);
      p5.fill(255);
      p5.text(T.toString().substring(0,5), 10, 10);
      p5.text(IllCounter, 10, 20);
      //p5.text(Vxs[0], 10, 30);
      //p5.text(Xs[0], 10, 50);
    }
      // Обновление системы
    for (let i = 0; i < N; i++) {
      if(Is_ill[i] && T - Last_illness_time[i] > Disease_duration){
        Is_ill[i] = false;
        IllCounter -= 1;
      }
        
      for (let j = 0; j < N; j++) {
        let d_square = (Xs[i] - Xs[j])**2 + (Ys[i] - Ys[j])**2;
        if (d_square > eps**2) {
          continue;
        }
          
        if(Is_ill[i] && !Is_ill[j]) {
          Is_ill[j] = true;
          IllCounter += 1;
          Last_illness_time[j] = T;
        }
      }
    }

    for (let i = 0; i < N; i++) {
      Xs[i] = Xs[i] + Vxs[i] * dT;
      Ys[i] = Ys[i] + Vys[i] * dT;
      Xs[i] = Xs[i] % Width;
      Ys[i] = Ys[i] % Width;

      if(Xs[i] < 0) {
        Xs[i] += Width;
      }

      if(Ys[i] < 0) {
        Ys[i] += Height;
      }
    }

    T += dT;
  };
};

new p5(sketch);
