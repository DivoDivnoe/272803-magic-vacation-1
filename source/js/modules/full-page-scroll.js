import throttle from 'lodash/throttle';
import {titleTypo as introTitleTypo, dateTypo as introDateTypo} from './intro.js';
import {paths} from './prizes.js';

export default class FullPageScroll {
  constructor() {
    this.THROTTLE_TIMEOUT = 2000;

    this.screenElements = document.querySelectorAll(`.screen:not(.screen--result)`);
    this.menuElements = document.querySelectorAll(`.page-header__menu .js-menu-link`);
    this.curtain = document.querySelector(`.curtain`);

    this.activeScreen = 0;
    this.onScrollHandler = this.onScroll.bind(this);
    this.onUrlHashChengedHandler = this.onUrlHashChanged.bind(this);

    this.wasVisitedPrizesPage = false;
  }

  init() {
    document.addEventListener(`wheel`, throttle(this.onScrollHandler, this.THROTTLE_TIMEOUT, {trailing: true}));
    window.addEventListener(`popstate`, this.onUrlHashChengedHandler);

    this.onUrlHashChanged();
  }

  async onScroll(evt) {
    const currentPosition = this.activeScreen;
    this.reCalculateActiveScreenPosition(evt.deltaY);
    if (currentPosition !== this.activeScreen) {
      await this.changePageDisplay();
    }
  }

  onUrlHashChanged() {
    const newIndex = Array.from(this.screenElements).findIndex((screen) => location.hash.slice(1) === screen.id);
    this.activeScreen = (newIndex < 0) ? 0 : newIndex;
    this.changePageDisplay();
  }

  async changePageDisplay() {
    await this.changeVisibilityDisplay();
    this.changeActiveMenuItem();
    this.emitChangeDisplayEvent();
  }

  async changeVisibilityDisplay() {
    for (const screen of this.screenElements) {
      if (screen.classList.contains(`active`) && screen.classList.contains(`screen--story`)
          && this.screenElements[this.activeScreen].classList.contains(`screen--prizes`)) {
        await this.showCurtain();

        if (!this.wasVisitedPrizesPage) {
          const firstPrizeImage = this.screenElements[this.activeScreen].querySelectorAll(`.prizes__item`)[0].querySelector(`img`);
          firstPrizeImage.src = this.getRandomPath(paths[0]);

          // console.log('setttt src');

          this.wasVisitedPrizesPage = true;
        }

      } else if (screen.classList.contains(`active`) && screen.classList.contains(`screen--rules`)) {
        screen.querySelector(`.rules__link`).classList.add(`hidden`);
      } else if (screen.classList.contains(`active`) && screen.classList.contains(`screen--intro`)) {
        introTitleTypo.reset();
        introDateTypo.reset();
      }

      screen.classList.add(`screen--hidden`);
      screen.classList.remove(`active`);
    }

    const currentScreen = this.screenElements[this.activeScreen];
    currentScreen.classList.remove(`screen--hidden`);

    // temp
    window.setTimeout(async () => {
      currentScreen.classList.add(`active`);
      this.removeCurtain();

      if (currentScreen.classList.contains(`screen--intro`)) {
        await introTitleTypo.animate();
        await introDateTypo.animate();
      } else if (currentScreen.classList.contains(`screen--prizes`) && !this.wasVisitedPrizesPage) {
        const firstPrizeImage = currentScreen.querySelectorAll(`.prizes__item`)[0].querySelector(`img`);
        firstPrizeImage.src = this.getRandomPath(paths[0]);

        this.wasVisitedPrizesPage = true;
      }
    }, 0);


    // this.screenElements[this.activeScreen].classList.add(`active`);
  }

  changeActiveMenuItem() {
    const activeItem = Array.from(this.menuElements).find((item) => item.dataset.href === this.screenElements[this.activeScreen].id);
    if (activeItem) {
      this.menuElements.forEach((item) => item.classList.remove(`active`));
      activeItem.classList.add(`active`);
    }
  }

  emitChangeDisplayEvent() {
    const event = new CustomEvent(`screenChanged`, {
      detail: {
        'screenId': this.activeScreen,
        'screenName': this.screenElements[this.activeScreen].id,
        'screenElement': this.screenElements[this.activeScreen]
      }
    });

    document.body.dispatchEvent(event);
  }

  reCalculateActiveScreenPosition(delta) {
    if (delta > 0) {
      this.activeScreen = Math.min(this.screenElements.length - 1, ++this.activeScreen);
    } else {
      this.activeScreen = Math.max(0, --this.activeScreen);
    }
  }

  showCurtain() {
    return new Promise((resolve) => {
      const tranisitionendHandler = () => {
        this.curtain.removeEventListener(`transitionend`, tranisitionendHandler);
        resolve();
      };

      this.curtain.addEventListener(`transitionend`, tranisitionendHandler);
      this.curtain.classList.add(`opened`);
    });
  }

  removeCurtain() {
    this.curtain.classList.remove(`opened`);
  }

  getRandomPath(path) {
    return `${path}?${Math.floor(Math.random() * 1000000000)}`;
  }
}
