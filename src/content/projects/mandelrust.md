---
title: mandelrust
name: mandelrust
date: 2022-05-10
size: 3.5K
tags:
  - rust
  - aws-lambda
  - terraform
  - mandelbrot
links:
  - label: live demo
    href: /mandelrust/
  - label: cdk code
    href: https://github.com/Ikerlb/mandelrust-lambda
  - label: terraform code
    href: https://github.com/Ikerlb/tf-mandelrust
---

### what?

i basically wanted to have a random zoom on an interesting mandelbrot point:

```
-0.761574 + -0.0847596i
```

### why?

- i wanted to try out rust in an aws lambda function
- i wanted to build that lambda function with cdk (i'm kinda procrastinating from learning/using terraform)
- i was kinda hyped to use rust after reading about it

### conclusions

- i'm starting to dig aws hehe.
- i **really** like rust and will keep using it as much as i can
- i will never ever find mandelbrot set uninteresting
- rust lambda startup time is unlike anything i've ever seen. it draws (for me, at least) the line between server and serverless kinda blurry

### todo

- well this seems obvious but i don't want to use a single point and a random zoom but rather a set of interesting points and a random zoom! all this seems kinda time consuming so i guess i'll leave it like this for a while
- i also want to optimize mb allocated for each lambda execution. 128mb takes around 13 seconds to finish, while 1gb takes around 3.

### update 10-5-2022

- i've been consuming a lot of terraform content. but as you may know by now, in the realm of programming you learn mostly by getting your hands dirty, so i tried importing (this is the single feature i liked the most) most of the resources i used on cdk and got them up & running in terraform. it is beautiful.
