/**
 * App-level Resolver Registration
 *
 * Import this file to auto-register all client-web resolvers.
 * Resolvers extend Core*Resolver classes from @inkcre/core and add Vue components.
 */

// Import all resolvers to trigger @ResolverManager.registry decorator
import "./text";
import "./image";
import "./video";
import "./html";
