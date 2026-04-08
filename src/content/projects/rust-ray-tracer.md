---
title: rust ray tracer
name: rust-ray-tracer
date: 2023-08-08
size: 8.1K
tags:
  - rust
  - computer-graphics
  - ray-tracing
links:
  - label: code
    href: https://github.com/Ikerlb/rust-ray-tracer
---

### what?

good old ray tracer again

![final scene](/ray-tracer/rust-spheres.png)

### why?

- earlier last year i followed [_Ray Tracing in One Weekend_](https://raytracing.github.io/books/RayTracingInOneWeekend.html) and implemented it in go to get a hang of the language. it was all nice and fun but rendering the final scene took around 20 minutes in my M1 Macbook Air, so i was left feeling a little dissatisfied.
- i have been solving many [_kattis_](https://open.kattis.com) problems in rust (particularly those that are just too slow to run in python), and i wanted to try rust on a slightly more complicated 'project'
- i really wanted to see how rust concurrency feels.

### conclusions

- computer graphics are very hard to debug. really. really. hard. i spent days fixing a very subtle bug.
- i started defining a trait 'hitable' and was planning to just extend types as i needed them, but as i started testing it, it really wasn't any faster than the go version. so i decided to replace as many allocations as possible and not use any dynamic dispatch and i think i'm happy with the results. i think rust enums make up for the lack of abstractness in this scenario
- [_rayon_](https://docs.rs/rayon/latest/rayon/) is cool and very very simple

### todo

- lights!
- more materials!
- more geometries!
- textures!
- [_Ray Tracing: The Next Week_](https://raytracing.github.io/books/RayTracingTheNextWeek.html)
- [_Ray Tracing: The Rest of Your Life_](https://raytracing.github.io/books/RayTracingTheRestOfYourLife.html)
