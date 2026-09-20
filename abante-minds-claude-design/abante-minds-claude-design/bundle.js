/* @ds-bundle: {"format":4,"namespace":"AbanteMinds","components":[{"name":"Button"},{"name":"SkillCard"},{"name":"PracticeHeader"},{"name":"CelebrationBanner"},{"name":"ProfileCard"}]} */
(function () {
  "use strict";

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === "text") {
          node.textContent = attrs[key];
        } else if (key.slice(0, 2) === "on" && typeof attrs[key] === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
        } else if (key === "style" && typeof attrs[key] === "object") {
          var styles = attrs[key];
          Object.keys(styles).forEach(function (prop) {
            if (prop.slice(0, 2) === "--") {
              node.style.setProperty(prop, styles[prop]); // custom properties drive the press mechanic
            } else {
              node.style[prop] = styles[prop];
            }
          });
        } else {
          node.setAttribute(key, attrs[key]);
        }
      });
    }
    return node;
  }

  var SKILL_COLORS = {
    1: { face: "var(--skill-1-100)", edge: "var(--skill-1-600)" },
    2: { face: "var(--skill-2-100)", edge: "var(--skill-2-600)" },
    3: { face: "var(--skill-3-100)", edge: "var(--skill-3-600)" },
    4: { face: "var(--skill-4-100)", edge: "var(--skill-4-600)" }
  };

  var BUTTON_VARIANTS = { primary: 1, ghost: 1, inverse: 1 };

  /**
   * Button — the one pill-shaped action control.
   * props: { label, variant?: "primary" | "ghost" | "inverse", onClick?, disabled? }
   */
  function Button(props) {
    props = props || {};
    var variant = BUTTON_VARIANTS[props.variant] ? props.variant : "primary";
    var btn = el("button", "am-reset am-pressable am-btn am-btn-" + variant + " button-label", {
      text: props.label || "Continue",
      type: "button"
    });
    if (props.disabled) btn.disabled = true;
    if (props.onClick) btn.addEventListener("click", props.onClick);
    return btn;
  }

  /**
   * SkillCard — one color-coded tile in the topic/skill picker.
   * props: { label, icon?, colorKey?: 1|2|3|4, progress?: number (0-1), onClick? }
   */
  function SkillCard(props) {
    props = props || {};
    var color = SKILL_COLORS[props.colorKey] || SKILL_COLORS[1];
    var card = el("button", "am-reset am-pressable am-skill-card", {
      type: "button",
      style: { background: color.face, "--am-edge": color.edge }
    });
    var icon = el("div", "am-skill-card-icon", {
      text: props.icon || "✳",
      style: { color: color.edge }
    });
    var label = el("div", "label", { text: props.label || "Skill area" });
    card.appendChild(icon);
    card.appendChild(label);
    if (typeof props.progress === "number") {
      var track = el("div", "am-skill-card-progress");
      var fill = el("span", "", {
        style: { width: Math.max(0, Math.min(1, props.progress)) * 100 + "%", background: color.edge }
      });
      track.appendChild(fill);
      card.appendChild(track);
    }
    if (props.onClick) card.addEventListener("click", props.onClick);
    return card;
  }

  /**
   * PracticeHeader — the calm-mode strip above a question: tier, progress, count.
   * props: { tier, questionIndex, questionTotal }
   */
  function PracticeHeader(props) {
    props = props || {};
    var wrap = el("div", "am-reset am-practice-header");
    var tier = el("span", "am-practice-header-tier caption", {
      text: props.tier || "Tier 1"
    });
    var track = el("div", "am-practice-header-track");
    var ratio = props.questionTotal ? (props.questionIndex || 0) / props.questionTotal : 0;
    var fill = el("span", "", { style: { width: Math.max(0, Math.min(1, ratio)) * 100 + "%" } });
    track.appendChild(fill);
    var count = el("span", "am-practice-header-count body-sm", {
      text: (props.questionIndex || 0) + " / " + (props.questionTotal || 0)
    });
    wrap.appendChild(tier);
    wrap.appendChild(track);
    wrap.appendChild(count);
    return wrap;
  }

  /**
   * CelebrationBanner — the full-screen reward moment. Its own energetic mode;
   * never mounted alongside calm/practice-mode chrome. A flat gold field with
   * ink-900 text; any button on it uses the inverse variant, because the amber
   * CTA disappears against gold.
   * props: { headline, sublabel?, icon?, actionLabel?, onAction? }
   */
  function CelebrationBanner(props) {
    props = props || {};
    var wrap = el("div", "am-reset am-celebration");
    var badge = el("div", "am-celebration-badge", { text: props.icon || "★" });
    var headline = el("div", "celebration-display", { text: props.headline || "Streak!" });
    wrap.appendChild(badge);
    wrap.appendChild(headline);
    if (props.sublabel) {
      wrap.appendChild(el("div", "celebration-heading", { text: props.sublabel }));
    }
    if (props.actionLabel) {
      var actions = el("div", "am-celebration-actions");
      actions.appendChild(Button({
        label: props.actionLabel,
        variant: "inverse",
        onClick: props.onAction
      }));
      wrap.appendChild(actions);
    }
    return wrap;
  }

  /**
   * ProfileCard — the personalized ID-card moment at login/profile.
   * props: { name, school?, initial?, colorKey?: 1|2|3|4 }
   */
  function ProfileCard(props) {
    props = props || {};
    var color = SKILL_COLORS[props.colorKey] || SKILL_COLORS[2];
    var card = el("div", "am-reset am-profile-card");
    var avatar = el("div", "am-profile-card-avatar", {
      text: props.initial || (props.name || "?").slice(0, 1).toUpperCase(),
      style: { background: color.edge }
    });
    var meta = el("div");
    meta.appendChild(el("div", "heading-sm", { text: "Hello, " + (props.name || "there") }));
    if (props.school) {
      meta.appendChild(el("div", "am-profile-card-meta body-sm", { text: props.school }));
    }
    card.appendChild(avatar);
    card.appendChild(meta);
    return card;
  }

  window.AbanteMinds = {
    Button: Button,
    SkillCard: SkillCard,
    PracticeHeader: PracticeHeader,
    CelebrationBanner: CelebrationBanner,
    ProfileCard: ProfileCard
  };
})();
