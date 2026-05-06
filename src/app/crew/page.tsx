import React from 'react';
import { Metadata } from 'next';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Crew Finder — TAKE ONE',
  description: 'Find film people across campuses. Search for directors, DPs, actors, and more.',
};

export default function CrewPage() {
  return (
    <>
      <header>
        <a href="/" className="logo">TAKE <span>ONE</span></a>
        <nav>
          <a href="/#explore">Scripts</a>
          <a href="/crew" className="active">Crew Finder</a>
          <a href="/profile">Profile</a>
        </nav>
      </header>

      <main>
        <section className="finder-hero">
          <div>
            <div className="hero-kicker">Crew Marketplace</div>
            <h1>Find film people without the chaos.</h1>
            <p>
              Browse directors, camera crew, actors, editors, sound, lights, and set support
              in one clean workspace. Search by role, city, college, or skill.
            </p>
          </div>
          <div className="hero-panel">
            <div className="panel-row">
              <span>Live Crew</span>
              <strong id="totalCrew">0</strong>
            </div>
            <div className="panel-row">
              <span>Selected Role</span>
              <strong id="selectedRoleLabel">All</strong>
            </div>
            <div className="panel-row">
              <span>Status</span>
              <strong>Ready</strong>
            </div>
          </div>
        </section>

        <section className="finder-shell">
          <aside className="filter-panel">
            <div className="filter-title">Browse Roles</div>
            <div className="role-filter-list" id="roleFilterList"></div>
          </aside>

          <section className="results-panel">
            <div className="search-stack">
              <div className="search-row">
                <input type="text" id="crewSearchInput" placeholder="Search by name, skill, college..." autoComplete="off" />
                <input type="text" id="citySearchInput" placeholder="City" autoComplete="off" />
                <button type="button" id="clearCrewFilters">Clear</button>
              </div>
              <div className="result-status" id="crewResultStatus">Loading registered people...</div>
            </div>

            <div className="crew-grid" id="crewGrid">
              <div className="crew-empty">Loading crew from MySQL...</div>
            </div>
          </section>
        </section>
      </main>

      <Script src="/scripts/api/api.js" strategy="beforeInteractive" />
      <Script src="/scripts/utils/helpers.js" strategy="beforeInteractive" />
      <Script src="/scripts/components/ui.js" strategy="beforeInteractive" />
      <Script src="/scripts/animations/common.js" strategy="beforeInteractive" />
      <Script src="/scripts/pages/crew.js" strategy="afterInteractive" />
    </>
  );
}
