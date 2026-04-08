---
title: go ray tracer
name: go-ray-tracer
date: 2022-02-21
size: 6.7K
tags:
  - go
  - computer-graphics
  - ray-tracing
links:
  - label: code
    href: https://github.com/Ikerlb/ray-tracer
---

### what?

a ray tracer of course! if you are not familiar with the term, it is basically a rendering technique that is very intuitive, and fairly easy to implement naively (and yields very decent results), but tends to be computationally expensive.

![final scene](/ray-tracer/go-spheres.png)

### why?

- back in my Modeling and Programming course, we were asked to implement a ray tracer in order to get one extra credit. back then, though, even fairly easy problems seemed very scary and alien to me (plus, i had a pretty good score already). i came across [_Ray Tracing in One Weekend_](https://raytracing.github.io/books/RayTracingInOneWeekend.html) recently and i thought i owed it to my old self to get it done as soon as possible.
- this should come as no surprise if you've read **anything** i post in this website, but i wanted to see how go felt when programming something bigger than a [leetcode](https://leetcode.com) problem.

### conclusions

- this was really really fun. if you haven't already give it a go (pun intended)! it is supremely well written and if you're anything like me, you'll have a blast.
- i implemented some very simple concurrency and i'm in awe of how easy goroutines and channels make for concurrent design. (also, i saw [this](https://www.youtube.com/watch?v=oV9rvDllKEg) long ago and it was in my mind throughout this project)
- i think i'm starting to like go (i mean, it is as simple as it gets). plus [generics!](https://go.dev/doc/tutorial/generics).

### todo

- while making it concurrent and giving it more cores to run in parallel made it significantly faster, i'm still not satisfied by the results. rendering the final scene of the project takes about 15 minutes in my M1 Macbook Air with the full 8 cores. i think i can squeeze some performance by making garbage collector do less work. we'll see how it goes.
- lights!
- more materials!
- more geometries!
- textures!
- [_Ray Tracing: The Next Week_](https://raytracing.github.io/books/RayTracingTheNextWeek.html)
- [_Ray Tracing: The Rest of Your Life_](https://raytracing.github.io/books/RayTracingTheRestOfYourLife.html)
