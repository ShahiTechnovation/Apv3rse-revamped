import React, { useState, useEffect } from 'react';
import { Switch } from '~/components/ui/Switch';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';

const GITHUB_CONFIG_COOKIE = 'githubConfig';

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  enabled: boolean;
  autoFetch: boolean;
}

export default function GitHubSettingsTab() {
  const [config, setConfig] = useState<GitHubConfig>({
    token: '',
    owner: 'aptos-labs',
    repo: 'move-by-examples',
    enabled: false,
    autoFetch: true,
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Load config from cookies
    const savedConfig = Cookies.get(GITHUB_CONFIG_COOKIE);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
      } catch (error) {
        console.error('Failed to parse GitHub config:', error);
      }
    }
  }, []);

  const saveConfig = () => {
    Cookies.set(GITHUB_CONFIG_COOKIE, JSON.stringify(config), { expires: 365 });
    
    // Update the backend configuration
    fetch('/api/move-contracts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateGitHubConfig',
        params: { config },
      }),
    })
      .then(() => {
        toast.success('GitHub configuration saved successfully');
      })
      .catch((error) => {
        toast.error('Failed to save GitHub configuration');
        console.error(error);
      });
  };

  const testConnection = async () => {
    if (!config.token) {
      toast.error('Please enter a GitHub token');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const response = await fetch('/api/move-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'searchGitHub',
          params: {
            githubConfig: config,
            pattern: '',
          },
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setConnectionStatus('success');
        toast.success(`Connected! Found ${result.data.contracts.length} contracts`);
      } else {
        setConnectionStatus('error');
        toast.error('Connection failed');
      }
    } catch (error) {
      setConnectionStatus('error');
      toast.error('Failed to test connection');
      console.error(error);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const fetchDatabaseStats = async () => {
    try {
      const response = await fetch('/api/move-contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getDatabaseStats',
          params: {},
        }),
      });

      const result = await response.json();
      if (result.success) {
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBrandGithub className="w-5 h-5" />
            GitHub Integration
          </CardTitle>
          <CardDescription>
            Configure GitHub API access to fetch Move contracts from aptos-labs/move-by-examples
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="github-enabled">Enable GitHub Integration</Label>
            <Switch
              id="github-enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="github-token">
              GitHub Personal Access Token
              <span className="text-xs text-muted-foreground ml-2">
                (Required for API rate limits)
              </span>
            </Label>
            <Input
              id="github-token"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={config.token}
              onChange={(e) => setConfig({ ...config, token: e.target.value })}
              disabled={!config.enabled}
            />
            <p className="text-xs text-muted-foreground">
              <a
                href="https://github.com/settings/tokens/new?scopes=repo"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary"
              >
                Generate a new token
              </a>{' '}
              with 'repo' scope for private repositories or no scope for public repositories.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="github-owner">Repository Owner</Label>
              <Input
                id="github-owner"
                placeholder="aptos-labs"
                value={config.owner}
                onChange={(e) => setConfig({ ...config, owner: e.target.value })}
                disabled={!config.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github-repo">Repository Name</Label>
              <Input
                id="github-repo"
                placeholder="move-by-examples"
                value={config.repo}
                onChange={(e) => setConfig({ ...config, repo: e.target.value })}
                disabled={!config.enabled}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="auto-fetch">
              Auto-fetch contracts when needed
              <span className="text-xs text-muted-foreground block">
                Automatically fetch contracts from GitHub if not found locally
              </span>
            </Label>
            <Switch
              id="auto-fetch"
              checked={config.autoFetch}
              onCheckedChange={(checked) => setConfig({ ...config, autoFetch: checked })}
              disabled={!config.enabled}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={testConnection}
              disabled={!config.enabled || isTestingConnection}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isTestingConnection ? (
                <IconRefresh className="w-4 h-4 animate-spin" />
              ) : connectionStatus === 'success' ? (
                <IconCheck className="w-4 h-4 text-green-500" />
              ) : connectionStatus === 'error' ? (
                <IconX className="w-4 h-4 text-red-500" />
              ) : (
                <IconBrandGithub className="w-4 h-4" />
              )}
              Test Connection
            </Button>
            <Button onClick={saveConfig} disabled={!config.enabled}>
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Contract Database Statistics</CardTitle>
            <CardDescription>
              Local contract database information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Contracts</p>
                <p className="text-2xl font-bold">{stats.totalContracts}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{stats.categories}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Features</p>
                <p className="text-2xl font-bold">{stats.features}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tags</p>
                <p className="text-2xl font-bold">{stats.tags}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-green-500">{stats.verified}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            When you prompt the AI to create smart contracts (NFTs, tokens, marketplaces, etc.):
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>The system detects your intent and categorizes the contract type</li>
            <li>It searches the local database for matching contract templates</li>
            <li>If enabled, it fetches additional contracts from GitHub</li>
            <li>The contracts are processed, validated, and customized for your project</li>
            <li>Frontend integration code is automatically generated</li>
          </ol>
          <p className="pt-2">
            <strong>Supported contract types:</strong> NFTs, Fungible Tokens, Marketplaces, 
            DeFi (Staking, AMM), Governance (DAO, Voting), Gaming, Social, and Utility contracts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
