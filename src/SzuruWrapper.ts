import axios, { AxiosRequestConfig } from 'axios';
import { LocalPost, LocalError } from './LocalTypes';
import { SzuruSiteConfig } from './Config';
import { TagsResult, TagCategoriesResult, Post } from './SzuruTypes';

/**
 * A 1:1 wrapper around the szurubooru API.
 *
 * @class SzuruWrapper
 */
export default class SzuruWrapper {
    baseUrl: string;
    apiUrl: string;
    username: string;
    authToken: string;

    private readonly baseHeaders = {
        "Accept": "application/json",
        "Content-Type": "application/json"
    };

    /**
     * Creates an instance of SzuruWrapper.
     * @param {string} baseUrl
     * @memberof SzuruWrapper
     */
    constructor(baseUrl: string, username: string, authToken: string) {
        const x = baseUrl.replace(/\/+$/, ""); // Trim trailing slashes, to make sure we only have one
        this.baseUrl = x + "/";
        this.apiUrl = x + "/api/";
        this.username = username;
        this.authToken = authToken;
    }

    async getInfo(): Promise<any> {
        return (await this.apiGet("info")).data;
    }

    async getTags(): Promise<TagsResult> {
        return (await this.apiGet("tags")).data;
    }

    async getTagCategories(): Promise<TagCategoriesResult> {
        return (await this.apiGet("tag-categories")).data;
    }

    async createPost(post: LocalPost): Promise<Post> {
        var obj = {
            tags: post.tags.map(x => x.name),
            safety: post.safety,
            source: post.source,
            contentUrl: post.imageUrl
        };

        console.log("Create new post object");
        console.dir(obj);

        return (await this.apiPost("posts", obj)).data;
    }

    private async apiGet(url: string, additionalHeaders: any = {}): Promise<any> {
        const fullUrl = this.apiUrl + url;
        const config: AxiosRequestConfig = {
            method: "GET",
            url: fullUrl
        }

        config.headers = { ...this.baseHeaders, ...additionalHeaders };
        return await this.execute(config);
    }

    private async apiPost(url: string, data: any, additionalHeaders: any = {}): Promise<any> {
        const fullUrl = this.apiUrl + url;
        const config: AxiosRequestConfig = {
            method: "POST",
            url: fullUrl,
            data: data
        }

        config.headers = { ...this.baseHeaders, ...additionalHeaders };
        return await this.execute(config);
    }

    private async execute(config: AxiosRequestConfig): Promise<any> {
        if (this.username && this.authToken) {
            const token = "Token " + btoa(`${this.username}:${this.authToken}`);
            config.headers["Authorization"] = token;
            // console.log(token);
        }

        try {
            return await axios(config);
        } catch (ex) {
            const error = ex.response.data as LocalError;
            throw error ? error : ex;
        }
    }

    static async createFromConfig(siteConfig: SzuruSiteConfig): Promise<SzuruWrapper | null> {
        return new SzuruWrapper(siteConfig.domain, siteConfig.username, siteConfig.authToken);
    }
}
