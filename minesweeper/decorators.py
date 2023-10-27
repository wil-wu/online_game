from flask import g, redirect, url_for
import functools


def login_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        if g.user is None:
            return redirect(url_for('views.auth'))

        return view(**kwargs)

    return wrapped_view
