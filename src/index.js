import p5 from "p5";

let config = {
  graph: {
    width: 600,
    heigth: 200,
    dot_size: 4,
    text_size: 30
  },
  simulation: {
    height: 600,
    width: 600,
    duration: 100,
    disease_duration: 10000,
    immunity_duration: -1, // negative for infinite immunity
    dT: 0.1,
    people: {
      speed: 10,
      number: 500,
      soc_active: 5,
      soc_passive: 3,
      soc_active_part: 0.1
    }
  }
};

let state = {
  time: 0.0,
  people: {},
  ill_counter: {
    value: 0,
    graph: {
      history: [],
      scale: 1
    },
    max: 0
  },
  previous: {
    history_length: 0,
    ill_counter_max: 0
  }
};

const sketch = p5 => {
  let field_buffer; // | TODO
  let graph_buffer; // |

  function init_simulation() {
    let soc_active_number = config.simulation.people.soc_active_part * config.simulation.people.number;

    state.time = 0.0;
    state.people = [];

    for (let i = 0; i < config.simulation.people.number; ++i) {
      let angle = p5.random(0, 2 * p5.PI);
      state.people.push({
        x: p5.random(0, config.simulation.width),
        y: p5.random(0, config.simulation.height),
        vx: config.simulation.people.speed * p5.cos(angle),
        vy: config.simulation.people.speed * p5.sin(angle),
        is_ill: false,
        last_illness_time: null,
        soc_distance:
          i < soc_active_number
            ? config.simulation.people.soc_active
            : config.simulation.people.soc_passive,
        has_immunity() {
          return config.simulation.immunity_duration &&
            this.last_illness_time &&
            (config.simulation.immunity_duration < 0 ||
              state.time - this.last_illness_time > config.simulation.disease_duration &&
              state.time - this.last_illness_time <= config.simulation.immunity_duration + config.simulation.disease_duration
            );
        },
        distance_square(person) {
          return (this.x - person.x) ** 2 + (this.y - person.y) ** 2;
        },
      });
    }
    state.people[0].is_ill = true;
    state.ill_counter.value = 1;

    state.ill_counter.graph.history = [[0]].concat(state.ill_counter.graph.history);
  }


  p5.setup = function () {
    p5.createCanvas(config.simulation.width, config.simulation.height);
    p5.background(0, 0, 0);
    init_simulation();
  };

  p5.mousePressed = () => {
    p5.saveJSON(state.ill_counter.graph.history, 'history.json', true);
  }

  p5.draw = () => {
    state.ill_counter.graph.history[0].push(state.ill_counter.value);
    state.ill_counter.max = Math.max(state.ill_counter.max, state.ill_counter.value);

    if (state.ill_counter.value == 0 || state.time > config.simulation.duration) {
      init_simulation();
      return;
    }


    p5.background(0, 0, 0);
    p5.fill(255);
    p5.text(p5.ceil(state.time), 10, 10);
    p5.text(state.ill_counter.value, 10, 20);

    state.people.forEach(person => {
      p5.fill(
        person.is_ill ? [255, 0, 0] :
          person.has_immunity() ? [100, 100, 100] :
            [0, 255, 0]
      );
      p5.circle(person.x, person.y, person.soc_distance);
    })

    state.people.forEach(person => {
      if (person.is_ill && state.time - person.last_illness_time > config.simulation.disease_duration) {
        person.is_ill = false;
        state.ill_counter.value -= 1;
      }

      if (person.is_ill) {
        state.people.forEach(person2 => {
          if (!person2.has_immunity() &&
            !person2.is_ill &&
            person.distance_square(person2) < (person.soc_distance + person2.soc_distance) ** 2) {
            person2.is_ill = true;
            state.ill_counter.value += 1;
            person2.last_illness_time = state.time;
          }
        });
      }

      person.x += person.vx * config.simulation.dT;
      person.y += person.vy * config.simulation.dT;

      person.x %= config.simulation.width;
      if (person.x < 0) {
        person.x += config.simulation.width;
      }

      person.y %= config.simulation.height;
      if (person.y < 0) {
        person.y += config.simulation.height;
      }
    });

    state.time += config.simulation.dT;
  };
};

const illness_graph = p5 => {
  p5.setup = () => {
    p5.createCanvas(
      config.graph.width,
      config.graph.heigth + config.graph.dot_size * 2 + config.graph.text_size
    );
    p5.background(255, 255, 255);
    p5.strokeWeight(0);
  };

  function draw_point(value, x) {
    let real_x = p5.floor(x / state.ill_counter.graph.scale);
    let real_y =
      config.graph.heigth * (1 - value / state.ill_counter.max) +
      config.graph.dot_size + config.graph.text_size;
    p5.circle(real_x, real_y, config.graph.dot_size);
  };

  p5.draw = () => {
    if (state.ill_counter.graph.history.length == 0) {
      return;
    }

    let need_full_redraw = false;

    let cur_graph_width = p5.floor(state.ill_counter.graph.history[0].length / state.ill_counter.graph.scale);
    if (cur_graph_width >= config.graph.width) {
      state.ill_counter.graph.scale *= 2;
      need_full_redraw = true;
    }
    else if (
      state.previous.ill_counter_max < state.ill_counter.max ||              // Max value changed
      state.previous.history_length < state.ill_counter.graph.history.length // New cycle is started
    ) {
      need_full_redraw = true;
    }

    if (need_full_redraw) {
      p5.background(255, 255, 255);
      p5.text("Max value: " + state.ill_counter.max, 10, 20);

      p5.fill(200);
      state.ill_counter.graph.history.slice(1)
        .forEach(graph_data =>
          graph_data.forEach(draw_point));

      p5.fill(0);
      state.ill_counter.graph.history[0].forEach(draw_point);
    }
    else {
      p5.fill(0);
      draw_point(state.ill_counter.value, state.ill_counter.graph.history[0].length);
    }

    state.previous.ill_counter_max = state.ill_counter.max;
    state.previous.history_length = state.ill_counter.graph.history.length;
  };
};

new p5(sketch, "field-div");
new p5(illness_graph, "graph-div");
