import p5 from "p5";

const sketch = p5 => {
  p5.setup = function () {
    p5.createCanvas(width, height);
    p5.background(0, 0, 0);
  };


  let height = 600;
  let width = 600;

  let N = 500;

  let disease_duration = 10;
  let speed = 30;
  let dT = 0.1;
  let body_size = 5.0;


  let people = [];
  for (let i = 0; i < N; i++) {
    let angle = p5.random(0, 2 * p5.PI);
    people.push({
      x: p5.random(0, width),
      y: p5.random(0, height),
      vx: speed * p5.cos(angle),
      vy: speed * p5.sin(angle),
      is_ill: false,
      has_immunity: false,
      last_illness_time: null,
      distance_square(person) {
        return (this.x - person.x) ** 2 + (this.y - person.y) ** 2
      },
    });
  }

  let ill_counter = 1;
  people[0].is_ill = true;


  let T = 0.0;
  p5.draw = function () {
    p5.background(0, 0, 0);

    people.forEach(person => {
      p5.fill(person.is_ill ? [255, 0, 0] : [0, 255, 0]);
      p5.circle(person.x, person.y, body_size);

      p5.fill(255);
      p5.text(T.toString().substring(0, 5), 10, 10);
      p5.text(ill_counter, 10, 20);

      if (person.is_ill && T - person.last_illness_time > disease_duration) {
        person.is_ill = false;
        person.has_immunity = true;
        ill_counter -= 1;
      }

      if (person.is_ill) {
        people.forEach(person2 => {
          if (!person2.has_immunity &&
              !person2.is_ill &&
              person.distance_square(person2) < body_size ** 2) {
            person2.is_ill = true;
            ill_counter += 1;
            person2.last_illness_time = T;
          }
        });
      }

      person.x += person.vx * dT;
      person.y += person.vy * dT;

      person.x %= width;
      if (person.x < 0) {
        person.x += width;
      }

      person.y %= height;
      if (person.y < 0) {
        person.y += height;
      }
    });

    T += dT;
  };
};

new p5(sketch);
