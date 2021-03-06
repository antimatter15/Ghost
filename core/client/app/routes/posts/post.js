import AuthenticatedRoute from 'ghost/routes/authenticated';
import ShortcutsRoute from 'ghost/mixins/shortcuts-route';
import isNumber from 'ghost/utils/isNumber';
import isFinite from 'ghost/utils/isFinite';

export default AuthenticatedRoute.extend(ShortcutsRoute, {
    model(params) {
        let post,
            postId,
            query;

        /* jscs:disable requireCamelCaseOrUpperCaseIdentifiers */
        postId = Number(params.post_id);

        if (!isNumber(postId) || !isFinite(postId) || postId % 1 !== 0 || postId <= 0) {
            return this.transitionTo('error404', params.post_id);
        }
        /* jscs:enable requireCamelCaseOrUpperCaseIdentifiers */

        post = this.store.peekRecord('post', postId);
        if (post) {
            return post;
        }

        query = {
            id: postId,
            status: 'all',
            staticPages: 'all'
        };

        return this.store.queryRecord('post', query).then((post) => {
            if (post) {
                return post;
            }

            return this.replaceRoute('posts.index');
        });
    },

    afterModel(post) {
        return this.get('session.user').then((user) => {
            if (user.get('isAuthor') && !post.isAuthoredByUser(user)) {
                return this.replaceRoute('posts.index');
            }
        });
    },

    setupController(controller, model) {
        this._super(controller, model);

        this.controllerFor('posts').set('currentPost', model);
    },

    shortcuts: {
        'enter, o': 'openEditor',
        'command+backspace, ctrl+backspace': 'deletePost'
    },

    actions: {
        openEditor(post) {
            post = post || this.get('controller.model');

            if (!post) {
                return;
            }

            this.transitionTo('editor.edit', post.get('id'));
        },

        deletePost() {
            this.send('openModal', 'delete-post', this.get('controller.model'));
        }
    }
});
