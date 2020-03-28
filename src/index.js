import p5 from "p5";

let ill_counter;

const sketch = p5 => {
  p5.setup = function () {
    p5.createCanvas(width, height).position(10, 10);
    p5.background(0, 0, 0);
  };


  let height = 600;
  let width = 600;

  let N = 500;

  let disease_duration = 12;
  let immunity_duration = 24; // negative for infinite immunity
  let speed = 10;
  let dT = 0.1;
  let body_size = 5.0;


  let T = 0.0;

  let people = [];
  for (let i = 0; i < N; ++i) {
    let angle = p5.random(0, 2 * p5.PI);
    people.push({
      x: p5.random(0, width),
      y: p5.random(0, height),
      vx: speed * p5.cos(angle),
      vy: speed * p5.sin(angle),
      is_ill: false,
      last_illness_time: null,
      has_immunity() {
        return immunity_duration &&
          this.last_illness_time &&
          (immunity_duration < 0 ||
            T - this.last_illness_time > disease_duration &&
            T - this.last_illness_time <= immunity_duration + disease_duration
          );
      },
      distance_square(person) {
        return (this.x - person.x) ** 2 + (this.y - person.y) ** 2
      },
    });
  }

  ill_counter = 1;
  people[0].is_ill = true;


  p5.draw = () => {
    p5.background(0, 0, 0);
    p5.fill(255);
    p5.text(p5.ceil(T), 10, 10);
    p5.text(ill_counter, 10, 20);

    people.forEach(person => {
      p5.fill(person.is_ill ? [255, 0, 0] : [0, 255, 0]);
      p5.circle(person.x, person.y, body_size);
    })

    people.forEach(person => {
      if (person.is_ill && T - person.last_illness_time > disease_duration) {
        person.is_ill = false;
        ill_counter -= 1;
      }

      if (person.is_ill) {
        people.forEach(person2 => {
          if (!person2.has_immunity() &&
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

const illness_graph = p5 => {
  let width = 600;
  let height = 200;
  let dot_size = 2;
  let text_size = 60;

  p5.setup = () => {
    p5.createCanvas(width, height + dot_size * 2 + text_size).position(10, 620);
    p5.background([255, 255, 255]);
  };

  let ill_counter_history = [];
  let max_value = 0;
  let scale = 1;

  function draw_point(value, x) {
    let real_x = p5.floor(x / scale);
    let real_y = height * (1 - value / max_value) + dot_size + text_size;
    p5.fill([0, 0, 0])
      .circle(real_x, real_y, dot_size);
  };

  p5.draw = () => {
    if (ill_counter == 0) {
      p5.text("There are no more ill people. Graph is finished", 10, 35)
      p5.draw = null;
      return;
    }

    let need_full_redraw = false;

    if (ill_counter > max_value) {
      max_value = ill_counter;
      need_full_redraw = true;
    }

    ill_counter_history.push(ill_counter);

    let graph_length = p5.floor(ill_counter_history.length / scale);

    if (graph_length >= width) {
      scale *= 2;
      need_full_redraw = true;
    }

    if (need_full_redraw) {
      p5.background([255, 255, 255])
      p5.text("Max value: " + max_value, 10, 20);
      ill_counter_history.forEach(draw_point);
    }
    else {
      draw_point(ill_counter, ill_counter_history.length);
    }
  };
};

new p5(sketch);
new p5(illness_graph);
