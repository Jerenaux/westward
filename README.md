# Westward

Westward is an open-source aspiring MMORPG written in Javascript. 

**Disclaimer**: Westward began as a closed-source project, and has grown that way for more than 2 years. As a result, the current codebase
is messy and not very collaboration-friendly. Documentation is sorely missing, the tests are a mess, and the code itself looks like
what a 2+ years codebase maintained by one guy can look like. You can make that change! I invite you to point out where the code is particularly 
unclear and where the lack of documentation is particularly painful. I will give top priority to addressing these feedbacks. 

## Vision

As a **game**, Westward aims to be a collaborative MMORPG where the players have to build a nation, starting from scratch and progressively
settling a large continent. A more lengthy description can be found on the [description page of the game](https://www.dynetisgames.com/2018/03/04/westward/).

As an **open-source project**, Westward aims to be a great collaborative experience for contributors of all sorts. The goal is also
to be a learning experience, for me as well as for developpers interested in gamedev. I hope the contributions and the community will grow into
a space for us to learn and have fun improving that game.

For more insight into the evolution of the project, check out the [dev logs](https://www.dynetisgames.com/category/dev-blog/).

## Community

- [Twitter (@jerome_renaux)](https://twitter.com/jerome_renaux)
- [Slack](https://join.slack.com/t/dynetisgames/shared_invite/enQtMTc0NzU2MjgzNDExLTNiMTMwNDJmMGQ1Y2FjM2ZhYTFhMGYzNWEyYmE3MjQ2YzAyNzYwYjQyODllZTZlYzM3ZDM0MGRiMGQyNjIxNWM)
- [Discord](https://discord.gg/NzUnS7F)
- [Stomt](https://www.stomt.com/westward)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.
At some point a Docker image should be rolled out to facilitate that process (feel free to contribute on that front if that's your area of expertise!)

### Prerequisites

- A recent version of Node.js
- A MongoDB instance listening on port 27017

### Installing

Clone this repository, then navigate to it and install the dependencies:

```
npm install
```

You should also create a file called `.env` at the root of the directory. This is where the `dotenv` package will be looking for
environment variables. Your local version doesn't need to define any environment variables, but `dotenv` will complain if that
file is missing. 

```
touch .env
```

## Running the tests

Some tests have been set up, mainly focusing on testing the client/server API and some internal server functions. They can be run as follows:

```
npm run test
```

These tests could be improved in a million ways, by being better documented, being more clean, or simply by adding more tests. In
an ideal world, the tests could act as a gateway to the codebase, providing a clear view of what is going on and helping contributors
dive in. It's not the case yet, but feel free to contribute on that front!

## Deployment

The master branch of this repository is deployed on an AWS EC2 instance maintained by myself. I will not elaborate too
much on that aspect since it doesn't impact contributions, but I can provide more information if there is demand for it.

## Built With

* [Phaser 3](https://github.com/photonstorm/phaser) on the client side - The best Javascript game engine
* [Node.js](https://nodejs.org/en/) on the server side 
* [MongoDB](https://www.mongodb.com/) for the database

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

* **[Jérôme Renaux](https://github.com/Jerenaux)** - *Initial work, project maintainer* 

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details

## Thanks

Many thanks to the following people for supporting Westward on [Patreon](https://www.patreon.com/jeromerenaux):
- Sean Pope

## Donate

If you are interested in Westward and want to see it grow, I invite you have a look at my [Patreon page](https://www.patreon.com/jeromerenaux)
where you can find a listing of rewards for various levels of recurring contributions. Even the smallest contributions can go a
long way as a signal of your interest and your support.

