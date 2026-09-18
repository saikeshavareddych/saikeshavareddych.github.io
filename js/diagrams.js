/* =========================================================================
   Architecture diagrams.
   Authored as data, injected as inline SVG so CSS can animate their internals.
   Flow lines are animated only while the diagram is on screen (see main.js),
   so an idle tab costs nothing.
   ========================================================================= */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* A box. `mod` tints the border: aws | azure | ok */
  function node(x, y, w, h, title, sub, mod) {
    var cls = "dg-node" + (mod ? " dg-node--" + mod : "");
    var ty = sub ? y + h / 2 - 1 : y + h / 2 + 3.5;
    var out = '<rect class="' + cls + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="3"/>';
    out += '<text class="dg-t" x="' + (x + w / 2) + '" y="' + ty + '" text-anchor="middle">' + esc(title) + "</text>";
    if (sub) {
      out += '<text class="dg-t dg-t--sm" x="' + (x + w / 2) + '" y="' + (y + h / 2 + 11) + '" text-anchor="middle">' + esc(sub) + "</text>";
    }
    return out;
  }

  /* A dashed boundary with a label in its top-left */
  function zone(x, y, w, h, label) {
    return '<rect class="dg-zone" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4"/>' +
      '<text class="dg-zone-l" x="' + (x + 9) + '" y="' + (y + 15) + '">' + esc(label) + "</text>";
  }

  /* An edge. `flow` adds the animated packet that rides the same path. */
  function link(d, flow) {
    var out = '<path class="dg-edge" d="' + d + '" marker-end="url(#dg-arw)"/>';
    if (flow !== false) out += '<path class="dg-flow" d="' + d + '"/>';
    return out;
  }

  function label(x, y, text, mod) {
    return '<text class="dg-t dg-t--sm' + (mod ? " dg-t--" + mod : "") + '" x="' + x + '" y="' + y + '">' + esc(text) + "</text>";
  }

  function pulse(cx, cy, r, fill) {
    return '<circle class="dg-pulse" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"/>';
  }

  function svg(vb, title, desc, body) {
    return '<svg viewBox="' + vb + '" role="img" aria-labelledby="t-' + title.id + ' d-' + title.id + '" xmlns="http://www.w3.org/2000/svg">' +
      '<title id="t-' + title.id + '">' + esc(title.text) + "</title>" +
      '<desc id="d-' + title.id + '">' + esc(desc) + "</desc>" +
      '<defs><marker id="dg-arw" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse">' +
      '<path d="M0 0 L8 4 L0 8 z" fill="#2b3a5c"/></marker></defs>' +
      body + "</svg>";
  }

  /* ---------------------------------------------------------------------
     1. Multi-cloud landing zone
     --------------------------------------------------------------------- */
  function landingZone() {
    var b = "";
    b += zone(196, 22, 300, 162, "AWS Organization");
    b += zone(196, 206, 300, 162, "Azure Tenant");

    b += node(16, 158, 150, 74, "Terraform", "modules + workspaces", "ok");
    b += label(24, 246, "one module set,");
    b += label(24, 258, "two providers");

    /* AWS column */
    b += node(212, 44, 126, 40, "Control Tower", "guardrails", "aws");
    b += node(212, 96, 126, 40, "Network account", "TGW + egress", "aws");
    b += node(354, 44, 126, 40, "Workload accts", "prod / stage / dev", "aws");
    b += node(354, 96, 126, 40, "IAM Identity Ctr", "OIDC to CI", "aws");
    b += node(212, 146, 268, 26, "VPC 10.0.0.0/8 - private subnets", null, "aws");

    /* Azure column */
    b += node(212, 228, 126, 40, "Mgmt groups", "policy scope", "azure");
    b += node(212, 280, 126, 40, "Hub VNet", "firewall + egress", "azure");
    b += node(354, 228, 126, 40, "Landing subs", "prod / stage / dev", "azure");
    b += node(354, 280, 126, 40, "Entra ID", "workload identity", "azure");
    b += node(212, 330, 268, 26, "Spoke VNets - peered to hub", null, "azure");

    /* Shared control plane */
    b += node(544, 44, 150, 46, "Remote state", "S3 + DynamoDB lock", "ok");
    b += node(544, 106, 150, 46, "Policy as code", "OPA / Conftest");
    b += node(544, 168, 150, 46, "Drift detection", "scheduled plan");
    b += node(544, 230, 150, 46, "Cost guardrails", "budgets + tags");
    b += node(544, 292, 150, 64, "Break-glass", "audited, time-boxed", "ok");

    /* Flows */
    b += link("M166 180 C 186 180 186 96 210 96");
    b += link("M166 208 C 186 208 186 290 210 290");
    b += link("M482 66 C 512 66 516 66 542 66");
    b += link("M482 248 C 512 248 516 130 542 130");

    b += pulse(168, 180, 3, "#3fd68b");
    b += pulse(168, 208, 3, "#3fd68b");

    return svg("0 0 710 380", { id: "lz", text: "Multi-cloud landing zone" },
      "A single Terraform module set provisions parallel AWS and Azure landing zones. AWS side: Control Tower guardrails, a network account with transit gateway egress, per-environment workload accounts and IAM Identity Center issuing OIDC credentials to CI. Azure side: management groups for policy scope, a hub VNet with firewall egress, per-environment landing zone subscriptions and Entra ID workload identity. Both clouds share one control plane: remote state in S3 with DynamoDB locking, OPA policy-as-code, scheduled drift detection, cost guardrails and an audited break-glass path.",
      b);
  }

  /* ---------------------------------------------------------------------
     2. AWS DevSecOps pipeline
     --------------------------------------------------------------------- */
  function devsecops() {
    var b = "";
    var y = 60, w = 96, h = 46;
    var xs = [16, 132, 248, 364, 480, 596];
    var stages = [
      ["Commit", "signed"],
      ["Build", "reproducible"],
      ["Test", "unit + contract"],
      ["Package", "image + SBOM"],
      ["Deploy", "stage"],
      ["Promote", "prod canary"]
    ];

    b += label(16, 34, "Pipeline", "sig");
    for (var i = 0; i < xs.length; i++) {
      b += node(xs[i], y, w, h, stages[i][0], stages[i][1], i === 5 ? "ok" : null);
      if (i < xs.length - 1) b += link("M" + (xs[i] + w) + " " + (y + h / 2) + " H " + (xs[i + 1] - 2));
    }

    /* Gates hang below the stage they block */
    b += label(80, 152, "Blocking gates");
    var gates = [
      [16, "Secret scan", "gitleaks"],
      [132, "SAST", "CodeQL"],
      [248, "SCA + licence", "Trivy fs"],
      [364, "Image scan", "Trivy + cosign"],
      [480, "DAST", "ZAP baseline"],
      [596, "Policy gate", "OPA + approval"]
    ];
    for (var g = 0; g < gates.length; g++) {
      b += node(gates[g][0], 166, w, 46, gates[g][1], gates[g][2]);
      b += link("M" + (gates[g][0] + w / 2) + " 164 V " + (y + h + 2), false);
    }

    /* Supply chain spine */
    b += node(16, 254, 212, 44, "OIDC to AWS", "no long-lived keys", "ok");
    b += node(248, 254, 212, 44, "Provenance", "SLSA attestation + SBOM");
    b += node(480, 254, 212, 44, "Auto rollback", "on SLO burn", "ok");
    b += link("M228 276 H 246");
    b += link("M460 276 H 478");

    b += label(16, 324, "Every gate fails closed. A red gate stops promotion, it does not warn.", "str");

    b += pulse(660, 83, 3.5, "#3fd68b");

    return svg("0 0 710 340", { id: "dso", text: "AWS DevSecOps pipeline" },
      "A six-stage delivery pipeline - commit, build, test, package, deploy to staging, promote to production canary - with a blocking security gate beneath each stage: secret scanning with gitleaks, SAST with CodeQL, software composition and licence analysis with Trivy, image scanning plus cosign signing, DAST with ZAP baseline, and a final OPA policy gate with manual approval. Underneath runs the supply-chain spine: OIDC federation to AWS with no long-lived keys, SLSA provenance attestation with SBOM, and automatic rollback triggered by SLO burn rate. Every gate fails closed.",
      b);
  }

  /* ---------------------------------------------------------------------
     3. Azure DevOps to AKS delivery platform
     --------------------------------------------------------------------- */
  function aksPlatform() {
    var b = "";
    b += zone(16, 22, 300, 150, "Azure DevOps");
    b += node(32, 48, 124, 42, "Azure Repos", "trunk + PR policy", "azure");
    b += node(176, 48, 124, 42, "Build pipeline", "YAML templates", "azure");
    b += node(32, 104, 124, 42, "Environments", "gated approvals", "azure");
    b += node(176, 104, 124, 42, "Variable groups", "Key Vault linked", "azure");
    b += link("M156 69 H 174");
    b += link("M94 92 V 102", false);

    b += node(352, 48, 140, 42, "ACR", "signed + scanned", "azure");
    b += link("M300 69 H 350");

    b += zone(346, 108, 348, 250, "AKS cluster");
    b += node(362, 134, 152, 40, "Ingress", "app gateway + TLS", "ok");
    b += node(362, 190, 152, 40, "Blue deployment", "current: 100%", "ok");
    b += node(362, 246, 152, 40, "Green deployment", "candidate: 0%");
    b += node(362, 302, 152, 40, "HPA", "cpu + custom metrics");

    b += node(534, 134, 144, 40, "Key Vault CSI", "secrets at mount");
    b += node(534, 190, 144, 40, "Workload identity", "no pod secrets", "ok");
    b += node(534, 246, 144, 40, "Pod security", "restricted baseline");
    b += node(534, 302, 144, 40, "Azure Monitor", "container insights");

    b += link("M422 90 V 132");
    b += link("M438 174 V 188");
    b += link("M470 174 C 500 174 500 246 470 246");
    b += link("M514 154 H 532", false);
    b += link("M514 210 H 532", false);

    b += label(352, 372, "Traffic shifts blue to green only after probes and the", "str");
    b += label(352, 384, "burn-rate alert have both stayed quiet for 10 minutes.", "str");

    b += pulse(508, 154, 3.5, "#3fd68b");

    return svg("0 0 710 400", { id: "aks", text: "Azure DevOps to AKS delivery platform" },
      "Azure DevOps hosts trunk-based repos with PR policy, YAML template build pipelines, gated deployment environments and Key-Vault-linked variable groups. Builds push signed, scanned images to Azure Container Registry, which feeds an AKS cluster. Inside the cluster: an application gateway ingress terminating TLS in front of blue and green deployments, with a horizontal pod autoscaler on CPU and custom metrics. Alongside run Key Vault CSI secret mounting, workload identity so no secrets live in pods, restricted pod security baseline, and Azure Monitor container insights. Traffic shifts from blue to green only after probes and the burn-rate alert stay quiet for ten minutes.",
      b);
  }

  /* ---------------------------------------------------------------------
     4. Observability and SLO platform
     --------------------------------------------------------------------- */
  function observability() {
    var b = "";
    b += label(16, 30, "Emit");
    b += node(16, 42, 118, 38, "AKS workloads", "auto-instrumented", "azure");
    b += node(16, 90, 118, 38, "EKS workloads", "auto-instrumented", "aws");
    b += node(16, 138, 118, 38, "Managed services", "exporters");
    b += node(16, 186, 118, 38, "Synthetic probes", "user journeys");

    b += label(170, 30, "Collect");
    b += node(170, 78, 122, 104, "OTel Collector", null, "ok");
    b += label(180, 142, "tail sampling");
    b += label(180, 155, "cardinality caps");
    b += label(180, 168, "one wire format");

    b += link("M134 61 C 152 61 152 100 168 100");
    b += link("M134 109 C 152 109 152 118 168 118");
    b += link("M134 157 C 152 157 152 136 168 136");
    b += link("M134 205 C 152 205 152 154 168 154");

    b += label(326, 30, "Store");
    b += node(326, 42, 130, 40, "Prometheus", "metrics, 15s");
    b += node(326, 92, 130, 40, "Loki", "logs, structured");
    b += node(326, 142, 130, 40, "Tempo", "traces, exemplars");
    b += link("M292 112 C 308 112 308 62 324 62");
    b += link("M292 122 H 324");
    b += link("M292 132 C 308 132 308 162 324 162");

    b += label(490, 30, "Decide");
    b += node(490, 42, 204, 40, "Grafana", "one pane, linked by trace ID", "ok");
    b += node(490, 92, 204, 40, "SLO + error budget", "burn-rate windows: 1h / 6h");
    b += node(490, 142, 204, 40, "Alertmanager", "routed by ownership");
    b += link("M456 62 H 488");
    b += link("M592 82 V 90", false);
    b += link("M592 132 V 140", false);

    b += node(490, 206, 96, 36, "Page", "fast burn", "ok");
    b += node(598, 206, 96, 36, "Ticket", "slow burn");
    b += link("M538 182 V 204", false);
    b += link("M646 182 V 204", false);

    b += node(16, 254, 678, 40, "Every alert links to the runbook that resolves it. If an alert has no runbook, it does not page.");

    b += pulse(283, 88, 4, "#3fd68b");

    return svg("0 0 710 310", { id: "obs", text: "Observability and SLO platform" },
      "Workloads on AKS and EKS, managed-service exporters and synthetic user-journey probes all emit to a single OpenTelemetry Collector that applies tail sampling, cardinality caps and one wire format. It fans out to Prometheus for fifteen-second metrics, Loki for structured logs and Tempo for traces with exemplars. Grafana joins all three in one pane linked by trace ID, feeding SLO error-budget burn-rate windows at one hour and six hours, which route through Alertmanager by ownership: fast burn pages, slow burn opens a ticket. Every alert links to the runbook that resolves it; an alert with no runbook does not page.",
      b);
  }

  /* ---------------------------------------------------------------------
     5. Hackathon platform - 48 hours, provisioned and destroyed
     --------------------------------------------------------------------- */
  function hackathon() {
    var b = "";
    b += node(16, 56, 128, 46, "Team signup", "form to queue", "ok");
    b += node(16, 116, 128, 46, "Provisioner", "Terraform per team");
    b += link("M80 102 V 114", false);

    b += zone(176, 22, 356, 224, "Shared cluster, one namespace per team");
    b += node(192, 48, 152, 38, "Namespace: team-01", "quota + netpol", "ok");
    b += node(192, 94, 152, 38, "Namespace: team-02", "quota + netpol", "ok");
    b += node(192, 140, 152, 38, "Namespace: team-nn", "quota + netpol");
    b += node(192, 190, 324, 40, "Wildcard TLS  *.hack.example  -  cert-manager, DNS-01", null, "ok");

    b += node(364, 48, 152, 38, "team-01.hack", "auto DNS + ingress");
    b += node(364, 94, 152, 38, "team-02.hack", "auto DNS + ingress");
    b += node(364, 140, 152, 38, "team-nn.hack", "auto DNS + ingress");
    b += link("M344 67 H 362");
    b += link("M344 113 H 362");
    b += link("M344 159 H 362");

    b += link("M144 139 C 162 139 162 67 190 67");
    b += link("M144 139 C 162 139 162 113 190 113");
    b += link("M144 139 C 162 139 162 159 190 159");

    b += node(556, 48, 138, 44, "Registry cache", "pull-through");
    b += node(556, 100, 138, 44, "CI runners", "autoscaled to zero");
    b += node(556, 152, 138, 44, "Scoreboard", "read-only replica");
    b += node(556, 204, 138, 44, "Teardown job", "T+48h, no exceptions", "ok");

    /* Timeline strip */
    b += '<rect class="dg-zone" x="16" y="278" width="678" height="46" rx="4"/>';
    b += label(28, 296, "T-0", "sig");
    b += label(28, 310, "cluster + 40 namespaces live in 11 min");
    b += label(268, 296, "T+36h", "sig");
    b += label(268, 310, "judging traffic spike, HPA absorbs it");
    b += label(508, 296, "T+48h", "sig");
    b += label(508, 310, "everything destroyed, spend stops");
    b += '<path class="dg-flow" d="M28 318 H 682"/>';

    b += pulse(134, 126, 4, "#3fd68b");

    return svg("0 0 710 336", { id: "hack", text: "Hackathon platform provisioned and destroyed in 48 hours" },
      "A team signup form feeds a queue that a Terraform provisioner drains, creating one namespace per team on a shared cluster with resource quotas and network policies. Each namespace gets an automatic DNS record and ingress on its own subdomain, covered by a wildcard TLS certificate issued by cert-manager over DNS-01. Shared services sit alongside: a pull-through registry cache, CI runners that autoscale to zero, a read-only scoreboard replica, and a teardown job that destroys everything at T plus 48 hours. Timeline: at T-0 the cluster and forty namespaces are live in eleven minutes; at T plus 36 hours judging traffic spikes and the autoscaler absorbs it; at T plus 48 hours everything is destroyed and spend stops.",
      b);
  }

  global.DIAGRAMS = {
    "landing-zone": landingZone,
    "devsecops": devsecops,
    "aks-platform": aksPlatform,
    "observability": observability,
    "hackathon": hackathon
  };
})(window);
