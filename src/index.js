import p5 from "p5";

let ill_counter = 0;
let ill_counter_graph_history = [];
let max_ill_counter = 0;
let T;

const sketch = p5 => {
  let height = 600;
  let width = 600;

  let N = 500;

  let one_simulation_duration = 100;
  let disease_duration = 10000;
  let immunity_duration = -1; // negative for infinite immunity
  let speed = 10;
  let dT = 0.1;
  let soc_active = 5;
  let soc_passive = 3;
  let soc_active_part = 0.1;

  let people;

  function init_simulation() {
    T = 0.0;
    people = [];

    for (let i = 0; i < N; ++i) {
      let angle = p5.random(0, 2 * p5.PI);
      people.push({
        x: p5.random(0, width),
        y: p5.random(0, height),
        vx: speed * p5.cos(angle),
        vy: speed * p5.sin(angle),
        is_ill: false,
        last_illness_time: null,
        soc_distance: i < soc_active_part * N ? soc_active : soc_passive,
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
    people[0].is_ill = true;
    ill_counter = 1;

    ill_counter_graph_history = [[0]].concat(ill_counter_graph_history);
  }


  p5.setup = function () {
    p5.createCanvas(width, height);
    p5.background(0, 0, 0);
    init_simulation();
  };

  p5.mousePressed = () => {
    p5.saveJSON(ill_counter_graph_history, 'history.json', true);
  }

  p5.draw = () => {
    ill_counter_graph_history[0].push(ill_counter);
    max_ill_counter = Math.max(max_ill_counter, ill_counter);

    if (ill_counter == 0 || T > one_simulation_duration) {
      init_simulation();
      return;
    }


    p5.background(0, 0, 0);
    p5.fill(255);
    p5.text(p5.ceil(T), 10, 10);
    p5.text(ill_counter, 10, 20);

    people.forEach(person => {
      p5.fill(
        person.is_ill ? [255, 0, 0] :
        person.has_immunity() ? [100, 100, 100] :
        [0, 255, 0]
      );
      p5.circle(person.x, person.y, person.soc_distance);
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
            person.distance_square(person2) < (person.soc_distance + person2.soc_distance) ** 2) {
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
  let dot_size = 4;
  let text_size = 30;

  let scale = 1;
  let need_full_graph_redraw = false;
  let prev_history_length = 0;
  let prev_max_ill_counter = 0;

  p5.setup = () => {
    p5.createCanvas(width, height + dot_size * 2 + text_size);
    p5.background(255, 255, 255);
    p5.strokeWeight(0);
  };

  function draw_point(value, x) {
    let real_x = p5.floor(x / scale);
    let real_y = height * (1 - value / max_ill_counter) + dot_size + text_size;
    p5.circle(real_x, real_y, dot_size);
  };

  p5.draw = () => {
    if (ill_counter_graph_history.length == 0) {
      return;
    }

    need_full_graph_redraw = false;

    let cur_graph_width = p5.floor(ill_counter_graph_history[0].length / scale);
    if (cur_graph_width >= width) {
      scale *= 2;
      need_full_graph_redraw = true;
    }
    else if (
      prev_max_ill_counter < max_ill_counter ||              // Max value changed
      prev_history_length < ill_counter_graph_history.length // New cycle is started
    ) {
      need_full_graph_redraw = true;
    }

    if (need_full_graph_redraw) {
      p5.background(255, 255, 255)
      p5.text("Max value: " + max_ill_counter, 10, 20);

      p5.fill(200);
      ill_counter_graph_history.slice(1)
        .forEach(graph_data =>
          graph_data.forEach(draw_point));

      p5.fill(0);
      ill_counter_graph_history[0].forEach(draw_point);
    }
    else {
      p5.fill(0);
      draw_point(ill_counter, ill_counter_graph_history[0].length);
    }

    prev_max_ill_counter = max_ill_counter;
    prev_history_length = ill_counter_graph_history.length
  };
};

new p5(sketch, "field-div");
new p5(illness_graph, "graph-div");
