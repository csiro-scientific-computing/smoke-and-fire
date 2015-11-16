# Air Pollution Visualisation in Australia
See `License.md` for details.

## Live website
The live website is at [http://research.csiro.au/static/airquality/smoke-and-fire/](http://research.csiro.au/static/airquality/smoke-and-fire/)

## Running a local copy
You can run the prototype by serving the `public` directory from your local machine.
Python has a nice way of doing so:

    $ cd public
    $ python -m SimpleHTTPServer 13579

Then go to http://localhost:13579 to see the local website.

## Building Javascript

In development, you will want to reserve a process to run the following:

```watchify *.js -d -v -o  public/smoke-and-fire.min.js```

For release, you will probably want to minify the output by doing:

```watchify *.js -d -v -o 'uglifyjs -cm > public/smoke-and-fire.min.js'```

## Credits
Xavier Ho <xavier.ho@csiro.au>, CSIRO

Martin Cope <martin.cope@csiro.au>, CSIRO

http://www.csiro.au